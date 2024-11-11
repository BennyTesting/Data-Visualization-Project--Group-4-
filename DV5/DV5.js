// Initialize global data variable
let globalData;
let isExpanded = false;
let expandedNode = null;  // Store the currently expanded node

// Set up dimensions and margins for the chart
const width = 1000;
const height = 650;

// Define color palette and scale
const customColorPalette = [
    "#a3d1f3", "#ffcc99", "#97e5a0", "#ffb3b3", "#c8a9f7", "#e1c89a",
    "#f8d8f2", "#d0d0d0", "#e7e88f", "#b5e7f9", "#e2a7ff", "#a2d9fa",
    "#a6e7f4", "#b6f1b6", "#f7f4a3", "#ffb3a3", "#c7b78f", "#b7cbe4",
    "#e0e0e0", "#ffb3b3", "#c9a6f2", "#a5b3f7", "#c4f0a3", "#f0f8b3",
    "#ffd699", "#d3d3d3", "#f8c2e6", "#a2d9fa", "#f6c7e8", "#b9a6b1",
    "#b2b870", "#b0e1b6", "#b2e397", "#f8f5b3", "#fcd89f", "#f1d1d1",
    "#87d9c9", "#a4c8fc", "#c8a9f7", "#a6e7f4"
];

const color = d3.scaleOrdinal(customColorPalette)
    .domain(d3.range(0, customColorPalette.length)); // Using the color palette based on index

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
    // Hide the lollipop chart initially
    hideLollipopChart();
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

    // Create the SVG element for the chart (reuse the existing SVG element)
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
    // Check if the user is clicking the same bubble that's already expanded
    if (isExpanded && expandedNode === d) {
        return; // Do nothing if the same bubble is clicked again
    }

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

    // Check if the Back button already exists, if not, append it
    if (d3.select(".back-button").empty()) {
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

    // Show the lollipop chart for the expanded country
    updateLollipopChart(d);
}
// Function to reset all bubbles to their original state but not remove the lollipop chart
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

    // Remove the "Back" button and its text
        d3.select(".back-button").remove();
        d3.select(".back-button-text").remove();
        // Remove the lollipop chart elements (lines, circles, and text)
        svg.selectAll(".lollipop-line").remove();
        svg.selectAll(".lollipop-circle").remove();
        svg.selectAll(".lollipop-text").remove();
        svg.selectAll(".lollipop-x-axis").remove();  // Remove x-axis
        svg.selectAll(".lollipop-y-axis").remove();  // Remove y-axis

    // Reset the expanded flag and expanded node (do not remove the lollipop chart)
    isExpanded = false;
    expandedNode = null;

    // The lollipop chart will remain intact (no reset)
}

/// Function to update the lollipop chart for the selected year
function updateLollipopChart(d) {
    const year = document.querySelector('.button.active').textContent;  // Get the active button year
    const svg = d3.select("svg");

    // Clear previous lollipop chart elements
    svg.selectAll(".lollipop-line").remove();
    svg.selectAll(".lollipop-circle").remove();
    svg.selectAll(".lollipop-text").remove();

    // Prepare the data for the selected country
    const lollipopData = globalData.map(d => ({
        name: d.Country,
        value: +d[year],  // Dynamically use the value for the selected year
    }));

    // Set up the scale for the lollipop chart
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(lollipopData, d => d.value)])  // Domain based on the max value
        .range([0, width * 0.8]);  // Place the lollipop chart in the center horizontally

    const yScale = d3.scaleBand()
        .domain(lollipopData.map(d => d.name))  // Countries as bands
        .range([50, height - 60])  // Place the lollipop chart vertically within the SVG
        .padding(0.1);  // Padding between bands

    // Add x-axis for value (horizontal axis)
    svg.selectAll(".lollipop-x-axis").remove();  // Remove previous axis
    svg.append("g")
        .attr("class", "lollipop-x-axis")
        .attr("transform", `translate(100, ${height - 60})`)  // Position the axis at the bottom
        .call(d3.axisBottom(xScale));

    // Add y-axis for countries (vertical axis)
    svg.selectAll(".lollipop-y-axis").remove();  // Remove previous axis
    svg.append("g")
        .attr("class", "lollipop-y-axis")
        .attr("transform", "translate(100, 0)")  // Position the axis on the left side
        .call(d3.axisLeft(yScale));

    // Add lines (lollipop stems) for each data point
    svg.selectAll(".lollipop-line")
        .data(lollipopData)
        .enter().append("line")
        .attr("class", "lollipop-line")
        .attr("x1", 100)  // Starting x position for the lines (leave space for the y-axis)
        .attr("x2", 100)  // Initially set the end point to 100 (starting position)
        .attr("y1", d => yScale(d.name) + yScale.bandwidth() / 2)  // Center line vertically for each country
        .attr("y2", d => yScale(d.name) + yScale.bandwidth() / 2)
        .style("stroke", "#555")  // Set the color of the line
        .style("stroke-width", 2)
        .transition()  // Apply transition for animation
        .duration(2000)  // Duration of the transition (1 second)
        .attr("x2", d => 100 + xScale(d.value));  // Animate the line to its real position

    // Add circles (lollipop heads) at the end of each line
    svg.selectAll(".lollipop-circle")
        .data(lollipopData)
        .enter().append("circle")
        .attr("class", "lollipop-circle")
        .attr("cx", 100)  // Starting x position for the circles (leave space for the y-axis)
        .attr("cy", d => yScale(d.name) + yScale.bandwidth() / 2)
        .attr("r", 6)
        .style("fill", "#555")  // Set the fill color of the circle
        .transition()  // Apply transition for animation
        .duration(2000)  // Duration of the transition (1 second)
        .attr("cx", d => 100 + xScale(d.value));  // Animate the circle to its real position

    // Add labels (value of the country) next to the lollipop circles
    svg.selectAll(".lollipop-text")
        .data(lollipopData)
        .enter().append("text")
        .attr("class", "lollipop-text")
        .attr("x", d => 100 + xScale(d.value) + 10)  // Offset text slightly to the right of the circle
        .attr("y", d => yScale(d.name) + yScale.bandwidth() / 2)
        .attr("dy", ".35em")  // Vertically align the text in the middle of the circle
        .style("font-size", "12px")
        .style("fill", "#000")
        .text(d => d.value)  // Display the value (rounded to 1 decimal place)
        .attr("opacity", 0)  // Initially hide the text
        .transition()  // Apply transition for animation
        .duration(3000)  // Duration of the transition (1 second)
        .attr("x", d => 100 + xScale(d.value) + 10)  // Animate text position to match the circle's x position
        .attr("opacity", 1);  // Fade in the text while moving
}

// Function to hide the lollipop chart (before any bubble is clicked)
function hideLollipopChart() {
    const svg = d3.select("svg");
    svg.selectAll(".lollipop-line").style("opacity", 0);
    svg.selectAll(".lollipop-circle").style("opacity", 0);
    svg.selectAll(".lollipop-text").style("opacity", 0);
}
