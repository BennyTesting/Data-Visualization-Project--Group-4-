// Set up dimensions and margins for the chart
const width = 1000;
const height = 650;

// Define color palette and scale
const customColorPalette = [
    "#5699d2", "#ff9b42", "#4cb65b", "#ff5b5b", "#9f81e5", "#b17c64",
    "#f1a6da", "#a1a1a1", "#d7d95d", "#78d7e3", "#c238e0", "#56a8f5",
    "#58cce1", "#7edc7e", "#f5f975", "#ff8355", "#9e7f4e", "#7f96b7",
    "#bdbdbd", "#ff6f6f", "#7f60e0", "#6e76f0", "#9bdd74", "#d5e17f",
    "#ffbc6b", "#c6c6c6", "#f2b2d0", "#56a8f5", "#e86fa9", "#4c3e42",
    "#6e6a49", "#7cc2a0", "#7f9b3b", "#e5e07c", "#ee9c33", "#d57d6d",
    "#3aa99a", "#6c7af0", "#9f81e5", "#58cce1"
];

// Color scale based on the custom color palette
const color = d3.scaleOrdinal(customColorPalette)
    .domain(d3.range(0, customColorPalette.length)); // Using the color palette based on index

// Initialize global data variable
let globalData;
let isExpanded = false;
let expandedNode = null;  // Store the currently expanded node

// Load the CSV data and call the update function
d3.csv("Living_With_HIV.csv").then(function(data) {
    globalData = data;
    // Initialize the chart with data for 2017
    updateYear("2017");
});

// Function to update the year selection and call the chart update
function updateYear(year) {
    // Highlight the active button
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => button.classList.remove('active'));
    document.querySelector(`button[onclick="updateYear('${year}')"]`).classList.add('active');
    
    // Update the chart based on the selected year
    updateChart(year);
}

// Function to create the bubble chart for a selected year
function updateChart(year) {
    // Clear any existing chart elements
    d3.select("svg").selectAll("*").remove();

    // Prepare the data for the selected year
    const rootData = {
        name: "LivingWithHIV",
        children: globalData.map((d, index) => ({
            id: d.Country,
            value: +d[year],  // Convert value to number for the selected year
            group: index,  // Use the index in the color palette
            name: d.Country
        }))
    };

    // Set up the bubble chart layout
    const bubble = d3.pack()
        .size([width, height])
        .padding(5);

    const root = d3.hierarchy(rootData)
        .sum(d => d.value);  // Set the size of the bubbles

    // Apply the bubble packing algorithm
    const nodes = bubble(root).descendants();

    // Create the SVG element for the chart
    const svg = d3.select("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet");

    // Create the nodes (bubbles)
    const node = svg.selectAll(".node")
        .data(nodes.filter(d => !d.children)) // Filter out non-leaf nodes (the bubbles)
        .enter().append("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x}, ${d.y})`);

    // Append circles for each bubble
    node.append("circle")
        .attr("r", 0)  // Start with radius 0 for the bounce effect
        .style("fill", d => color(d.data.group))  // Apply color scale based on group
        .style("stroke", "black")  // Add black stroke
        .style("stroke-width", 1)  // Set stroke width
        .style("opacity", 0.7)
        .transition()  // Apply transition to animate the bubbles
        .duration(1000)  // Duration of the bounce animation (1 second)
        .ease(d3.easeElasticOut)  // Use elastic easing for bounce effect
        .attr("r", d => d.r);  // Set final radius (size) of the bubble

    // Add country names as text inside the bubbles
    node.append("text")
        .attr("dy", ".3em")  // Align vertically at the center of the circle
        .attr("text-anchor", "middle")  // Align horizontally at the center of the circle
        .style("font-size", "12px")  // Fixed font size (no resizing based on circle size)
        .style("fill", "#000")  // Set text color to black for contrast
        .text(d => d.data.name)  // Display country name
        .each(function(d) {
            // Clipping: If text is too long, it will be cut off by the circle's boundary
            const textWidth = this.getComputedTextLength();
            if (textWidth > d.r * 2) {
                // Truncate text if it's too long to fit inside the circle
                d3.select(this).text(d.data.name.slice(0, Math.floor(d.r * 2 / 7)) + "...");
            }
        });

// Handle click event to expand the bubble
node.on("click", function(event, d) {
    // Expand the clicked bubble (no need to check for reset or back button here)
    expandBubble(d);
});
}

// Function to expand the clicked bubble
function expandBubble(d) {
    // Set expanded flag and store the expanded node
    isExpanded = true;
    expandedNode = d;

    const svg = d3.select("svg");

    // Hide all text (including the expanded bubble's text)
    svg.selectAll(".node text")
        .transition()
        .duration(500)
        .style("opacity", 0);  // Hide all text, including the expanded bubble's text

    // Calculate the maximum radius that will cover the entire SVG
    const maxRadius = Math.max(width, height);

    // Animate all other bubbles to shrink and hide the text
    svg.selectAll(".node circle")
        .transition()
        .duration(500)
        .attr("r", 0)
        .style("opacity", 0);

    // Expand the selected bubble to cover the whole SVG
    const expandedCircle = svg.selectAll(".node")
        .filter(node => node === expandedNode)
        .select("circle")
        .transition()
        .duration(500)
        .attr("r", maxRadius)  // Set radius to the max size of the SVG
        .style("opacity", 1);

    // Show the text of the expanded bubble after it has expanded
    svg.selectAll(".node text")
        .filter(node => node === expandedNode)
        .transition()
        .duration(500)
        .style("opacity", 0);  // Show text for the expanded bubble

    // Append the rectangle with transition for BACK button
    svg.append("rect")
        .attr("x", width - 100)  // Position it at the top-right corner (width of the SVG minus the button width)
        .attr("y", 15)  // Set vertical position (15px from the top)
        .attr("width", 80)  // Button width
        .attr("height", 40)  // Button height
        .style("fill", "#555")  // Lighter black background color
        .style("stroke", "#000")  // Black border color
        .style("stroke-width", 2)
        .attr("class", "back-button")  // Add a class to the rectangle for targeting
        .style("opacity", 0)  // Start with the rectangle invisible
        .transition()  // Add transition to the rectangle
        .duration(500)  // Duration of the transition (0.5s)
        .style("opacity", 1);  // Fade in to full opacity

    // Append the text (on top of the rectangle) with transition
    svg.append("text")
        .attr("x", width - 60)  // Position the text centered horizontally within the rect
        .attr("y", 40)  // Position text vertically (middle of the rect)
        .attr("text-anchor", "middle")  // Center the text horizontally
        .style("font-size", "16px")
        .style("cursor", "pointer")
        .style("fill", "#fff")  // White text
        .text("BACK")
        .attr("class", "back-button-text")  // Add a class to the text for targeting
        .style("opacity", 1)  // Start with the text invisible
        .transition()  // Add transition to the text
        .duration(500)  // Duration of the transition (0.5s)
        .style("opacity", 1);  // Fade in to full opacity

    // Add event listener for clicking the BACK button
    d3.selectAll(".back-button, .back-button-text")  // Select both rect and text
        .on("click", function() {
            resetBubbles();  // Reset bubbles when BACK is clicked
            d3.select(".back-button").remove();  // Remove the BACK button rectangle
            d3.select(".back-button-text").remove();  // Remove the BACK button text
        });
}


// Function to reset all bubbles to their original state
function resetBubbles() {
    const svg = d3.select("svg");

    // Animate all bubbles back to their original size
    svg.selectAll(".node circle")
        .transition()
        .duration(500)
        .attr("r", d => d.r)  // Reset to the original radius
        .style("opacity", 0.7);

    svg.selectAll(".node text")
        .transition()
        .duration(500)
        .style("opacity", 1);  // Show all text again

    // Set the expanded flag back to false
    isExpanded = false;
    expandedNode = null;  // Reset the expanded node
}
