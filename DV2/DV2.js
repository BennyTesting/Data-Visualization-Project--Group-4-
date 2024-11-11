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
            .center([18, 58]) // Move the map further left and up (Adjust as necessary)
            .scale(400)         // Adjust scale to fit the container
            .translate([width / 2, height / 2]); // Center the map in the SVG container

        // Define a path generator
        const path = d3.geoPath().projection(projection);

        // Determine the min and max values for setting the color scale
        const values = Array.from(dataMap.values());
        const minValue = d3.min(values);
        const maxValue = d3.max(values);

        // Define a color scale with more range (added additional steps)
        const color = d3.scaleLinear()
            .domain([500, 1000, 2000, 5000, 10000, 20000, 30000, 50000, maxValue])  // Updated range steps
            .range([ 
                "#f7fcb9", "#d9f0a3", "#addd8e", "#78c679", "#41ab5d", "#238b45", 
                "#006d2c", "#00441b", "#004d27"  // Max value gets an even darker green
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
                const value = dataMap.get(d.properties.ISO2); // Use ISO2 for matching
                return value ? color(value) : "#ccc"; // Default color if no data
            })
            .attr("stroke", "#333") // Add stroke color (dark gray or any color you prefer)
            .attr("stroke-width", 1) // Set stroke width
            .on("mouseover", function(event, d) {
                d3.select(this).style("fill", "orange"); // Highlight on hover

                // Set tooltip content and position
                const value = dataMap.get(d.properties.ISO2);
                tooltip.transition().duration(200).style("opacity", .9);

                // Set the tooltip content dynamically based on data
                tooltip.html(`${d.properties.NAME}: ${value !== undefined ? value : "No data"}`);

                // Ensure the tooltip is displayed at the right position
                tooltip.style("left", (event.pageX + 5) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const value = dataMap.get(d.properties.ISO2);
                d3.select(this).style("fill", value ? color(value) : "#ccc");

                // Hide the tooltip
                tooltip.transition().duration(500).style("opacity", 0);
            });

        // Clear old legend items (country names are removed)
        d3.select("#legend").selectAll("*").remove();

        // Add the gradient scale for color (scale bar format)
        const legendWidth = 200; // Width of the color scale legend
        const legend = d3.select("#legend");

        // Create a legend scale based on the color scale
        const legendScale = d3.scaleLinear()
            .domain([minValue, maxValue])
            .range([0, legendWidth]);

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

        // Add a rectangle to display the color scale (gradient bar)
        legend.append("rect")
            .attr("x", 0)
            .attr("y", 20)
            .attr("width", legendWidth)
            .attr("height", 20)
            .style("fill", "url(#linear-gradient)");

        // Number of ticks you want along the bottom of the legend
        const numTicks = 3; 
        const midValue = (minValue + maxValue) / 2;

        // Generate tick values at equal intervals
        const tickValues = d3.range(minValue, maxValue + 1, (maxValue - minValue) / (numTicks - 1));

        // Append ticks (lines) along the bottom
        legend.selectAll(".tick")
            .data(tickValues)
            .enter().append("line")
            .attr("x1", d => legendScale(d))  // Position the tick along the x-axis
            .attr("x2", d => legendScale(d))  // Ensure tick is vertical
            .attr("y1", 20)                   // Position tick at the bottom line
            .attr("y2", 40)                   // Extend tick down (adjust if needed)
            .attr("stroke", "#000")           // Tick color
            .attr("stroke-width", 1);         // Tick width

        legend.append("text")
            .attr("x", legendScale(midValue))  // Position it at the scale of the mid value
            .attr("y", 40)
            .attr("dy", "1em")
            .style("text-anchor", "middle")  // Center align the mid label
            .style("font-size", "14px")
            .text(`${midValue.toFixed(0)}`);  // Optionally format the mid value    

        // Add text labels for the min and max value (as before)
        legend.append("text")
            .attr("x", 0)
            .attr("y", 40)
            .attr("dy", "1em")
            .style("text-anchor", "start")
            .style("font-size", "14px")
            .text(`0`);

        legend.append("text")
            .attr("x", legendWidth)
            .attr("y", 40)
            .attr("dy", "1em")
            .style("text-anchor", "end")
            .style("font-size", "14px") 
            .text(`${maxValue}`);
    });
}

// Zoom functionality using d3.zoom
const zoom = d3.zoom()
    .scaleExtent([0.5, 5]) // Min and Max zoom level
    .on("zoom", function(event) {
        svg.selectAll("path").attr("transform", event.transform);
    });

svg.call(zoom);