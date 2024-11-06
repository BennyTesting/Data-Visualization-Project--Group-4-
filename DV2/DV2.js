const svg = d3.select("svg");
const tooltip = d3.select(".tooltip"); // Select the tooltip
const width = +svg.attr("width") ;
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

        // Define a projection (centered around Europe)
        const projection = d3.geoMercator()
            .center([-15, 65]) // Adjust this to center the map around the desired coordinates
            .scale(500) // Adjust scale to zoom in or out
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
            .on("mouseover", function(event, d) {
                d3.select(this).style("fill", "orange"); // Highlight on hover

                // Set tooltip content and position
                const value = dataMap.get(d.properties.ISO2);
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(`${d.properties.NAME}: ${value !== undefined ? value : "No data"}`)
                    .style("left", (event.pageX + 5) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function(event, d) {
                const value = dataMap.get(d.properties.ISO2);
                d3.select(this).style("fill", value ? color(value) : "#ccc");

                // Hide tooltip
                tooltip.transition().duration(500).style("opacity", 0);
            });
    });
}

