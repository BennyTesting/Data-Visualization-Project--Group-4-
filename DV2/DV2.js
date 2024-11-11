const svg = d3.select("#geomap");
const tooltip = d3.select(".tooltip");
const width = +svg.attr("width");
const height = +svg.attr("height");

let dataMap = new Map(); // To store data for the selected year
let years = []; // Store the years for the slider

// Load the geoJSON and CSV data
Promise.all([
    d3.json("europe_map.json"),
    d3.csv("Geomap.csv")
]).then(([geoData, csvData]) => {
    // Populate years array
    years = Array.from(new Set(csvData.map(d => d.Time))).sort();
    
    // Set the range input attributes
    const yearSlider = d3.select("#yearSlider")
        .attr("max", years.length - 1)
        .attr("value", 0)
        .on("input", function() {
            const selectedYear = years[this.value];
            updateMap(geoData, selectedYear);
            d3.select("#yearLabel").text(selectedYear); // Update label
        });

    // Initialize label
    d3.select("#yearLabel").text(years[0]);

    // Initial map update
    updateMap(geoData, years[0]); // Default to the first year
});

function updateMap(geoData, selectedYear) {
    // Filter CSV data for the selected year and create a map for it
    dataMap.clear(); // Clear previous data
    d3.csv("Geomap.csv").then(csvData => {
        csvData.forEach(d => {
            if (d.Time === selectedYear) {
                dataMap.set(d.RegionCode, +d.TotalValue); // Use RegionCode as key
            }
        });

        // Define a projection centered around Europe but adjusted to be more to the left and up
        const projection = d3.geoMercator()
            .center([18, 58])
            .scale(400)
            .translate([width / 2, height / 2]);

        // Define a path generator
        const path = d3.geoPath().projection(projection);

        // Determine the min and max values for setting the color scale
        const values = Array.from(dataMap.values());
        const minValue = d3.min(values);
        const maxValue = d3.max(values);

        // Define a color scale with more range (added additional steps)
        const color = d3.scaleLinear()
            .domain([500, 1000, 2000, 5000, 10000, 20000, 30000, 50000, maxValue])
            .range([ 
                "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238b45", 
                "#006d2c", "#00441b", "#004d27"
            ]);

        // Clear previous map
        svg.selectAll("path").remove();

        // Draw the countries
        svg.selectAll("path")
            .data(geoData.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", d => {
                const value = dataMap.get(d.properties.ISO2);
                return value ? color(value) : "#ccc";
            })
            .attr("stroke", "#333")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this).style("fill", "orange");

                const value = dataMap.get(d.properties.ISO2);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`${d.properties.NAME}: ${value !== undefined ? value : "No data"}`);
                tooltip.style("left", (event.pageX + 5) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const value = dataMap.get(d.properties.ISO2);
                d3.select(this).style("fill", value ? color(value) : "#ccc");
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Gradient scale legend with ruler ticks
        const legendWidth = 200;
        const legend = d3.select("#legend");

        // Clear previous legend items
        legend.selectAll("*").remove();

        // Append a gradient for the color scale
        const gradient = legend.append("defs")
            .append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        gradient.selectAll("stop")
            .data(color.range())
            .enter().append("stop")
            .attr("offset", (d, i) => `${(i / (color.range().length - 1)) * 100}%`)
            .attr("stop-color", d => d);

        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20)
            .attr("width", legendWidth)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient)");

        // Ruler ticks and labels
        const legendScale = d3.scaleLinear()
            .domain([0, maxValue]) // Start the domain at 0
            .range([0, legendWidth]);

        const ticks = [0, (0 + maxValue) / 2, maxValue];

        legend.selectAll(".tick")
            .data(ticks)
            .enter().append("line")
            .attr("x1", d => legendScale(d))
            .attr("x2", d => legendScale(d))
            .attr("y1", 20)
            .attr("y2", 40)
            .attr("stroke", "#000");

        legend.selectAll(".tick-label")
            .data(ticks)
            .enter().append("text")
            .attr("x", d => legendScale(d))
            .attr("y", 55)
            .style("text-anchor", d => d === 0 ? "start" : d === maxValue ? "end" : "middle")
            .text(d => Math.round(d));

        // Populate the table with highest and lowest values
        const sortedData = Array.from(dataMap.entries())
            .filter(d => d[1] > 0)  // Filter out entries with a value of 0
            .sort((a, b) => a[1] - b[1]);

        // If there is no data after filtering, handle the case
        if (sortedData.length === 0) {
            const tableBody = d3.select("#dataTable tbody");
            tableBody.html(""); // Clear previous entries

            tableBody.append("tr")
                .html(`<td colspan="3" style="text-align: center; border: 1px solid black;">No data with values greater than 0</td>`);
            return;
        }

        const lowest = sortedData[0];
        const highest = sortedData[sortedData.length - 1];

        const tableBody = d3.select("#dataTable tbody");
        tableBody.html(""); // Clear previous entries

        // Add lowest entry
        tableBody.append("tr")
            .html(`<td style="text-align: left; border: 1px solid black;">Lowest</td>
                   <td style="text-align: center; border: 1px solid black;">${lowest[0]}</td>
                   <td style="text-align: right; border: 1px solid black;">${lowest[1]}</td>`);

        // Add highest entry
        tableBody.append("tr")
            .html(`<td style="text-align: left; border: 1px solid black;">Highest</td>
                   <td style="text-align: center; border: 1px solid black;">${highest[0]}</td>
                   <td style="text-align: right; border: 1px solid black;">${highest[1]}</td>`);
    });
}

// Zoom functionality using d3.zoom
const zoom = d3.zoom()
    .scaleExtent([0.5, 5]) // Min and Max zoom level
    .on("zoom", function(event) {
        svg.selectAll("path").attr("transform", event.transform);
    });

svg.call(zoom);
