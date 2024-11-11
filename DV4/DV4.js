// Set up the dimensions of the pie chart
const width = 400;
const height = 400;
const radius = Math.min(width, height) / 2;
const color = d3.scaleOrdinal()
    .domain(["Male", "Female"])
    .range(["#1E90FF", "#FF6347"]); // Male = blue, Female = red

// Create the SVG container
const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${width / 2}, ${height / 2})`);

// Create the pie chart layout
const pie = d3.pie()
    .value(d => d.TotalValue)
    .sort(null); // Don't sort by default

// Create the arc path generator
const arc = d3.arc()
    .outerRadius(radius - 10)
    .innerRadius(0);

// Function to create the pie chart
function createPieChart(data) {
    const totalValue = d3.sum(data, d => d.TotalValue);

    // Set the chart data
    const arcData = pie(data);

    // Bind the data to the paths
    const paths = svg.selectAll(".arc")
        .data(arcData);

    // Remove any exiting paths (if there's any)
    paths.exit()
        .transition()
        .duration(750)
        .attrTween("d", arcTweenExit)
        .remove();

    // Update the existing paths with new data
    paths.transition()
        .duration(750)
        .attrTween("d", arcTween);

    // Add new slices if there are any
    paths.enter()
        .append("path")
        .attr("class", "arc")
        .attr("fill", d => color(d.data.Gender))
        .attr("d", arc)
        .each(function(d) { this._current = d; }) // Store initial angles
        .transition()
        .duration(750)
        .attrTween("d", arcTween);

    // Add the labels (percentage + TotalValue) inside the slices
    const labels = svg.selectAll(".label")
        .data(arcData);

    // Update the existing labels
    labels.transition()
        .duration(750)
        .attr("transform", d => "translate(" + arc.centroid(d) + ")")
        .text(d => {
            const percentage = ((d.data.TotalValue / totalValue) * 100).toFixed(1);
            return `${percentage}%`;
        });

    // Add new labels
    labels.enter()
        .append("text")
        .attr("class", "label")
        .attr("transform", d => "translate(" + arc.centroid(d) + ")")
        .attr("text-anchor", "middle")
        .attr("font-size", "20px")
        .attr("fill", "#fff")
        .text(d => {
            const percentage = ((d.data.TotalValue / totalValue) * 100).toFixed(1);
            return `${percentage}%`;
        });
}

// Function to fade in words one by one with proper spacing
function fadeInDescriptionWords(descriptionBox) {
    const paragraph = descriptionBox.querySelector("p");
    const words = paragraph.innerText.split(" "); // Split the text into words
    
    // Clear the paragraph text and rebuild it word by word
    paragraph.innerHTML = "";  // Clear the existing text (we will rebuild it word by word)
    
    // Create spans for each word
    words.forEach((word, index) => {
        const span = document.createElement("span");
        span.textContent = word;  // Insert the word as text inside the span
        span.style.opacity = 0;  // Start with opacity 0 (invisible)
        span.style.display = "inline-block";  // Ensure each word is treated as an inline block
        
        // Append the word span
        paragraph.appendChild(span);

        // Add a space between words by appending a normal space (not a span)
        if (index < words.length - 1) {
            paragraph.appendChild(document.createTextNode(" ")); // Adding a regular space
        }

        // Apply the fade-in transition to each word
        d3.select(span)
            .transition()
            .delay(index * 25)  // Delay each word by 150ms
            .duration(50)        // Duration of the fade-in
            .style("opacity", 1); // Fade the word in
    });
}

// Load the CSV data
d3.csv("PieChart.csv").then(function(data) {
    // Parse the data: convert "TotalValue" to numbers
    data.forEach(d => {
        d.TotalValue = +d.TotalValue; // Ensure TotalValue is numeric
    });

    // Group data by year
    const groupedData = d3.groups(data, d => d.Year);

    // Initialize with 2017 data
    const initialData = groupedData.find(d => d[0] == 2017)[1];
    createPieChart(initialData);

// Function to update the pie chart and descriptions based on the selected year
window.updateChart = function(year) {   
    // Update the active button style
    const buttons = document.querySelectorAll("button");
    buttons.forEach(button => button.classList.remove("active"));
    document.getElementById("button" + year).classList.add("active");

    const yearData = groupedData.find(d => d[0] == year)[1];
    createPieChart(yearData);

    // Hide all description boxes
    const allDescriptionBoxes = document.querySelectorAll(".year-description-box");
    allDescriptionBoxes.forEach(box => box.style.display = "none");

    // Show the description box for the selected year
    const descriptionBox = document.getElementById("description" + year);
    descriptionBox.style.display = "block";  // Show the description box

    // Update the year label inside the selected description box
    const yearLabel = document.getElementById("year-label-" + year); // Select the unique year label
    yearLabel.innerText = `Rate of HIV and AIDS Infection between Male and Female`;

    // Fade in the text inside the description box
    fadeInDescriptionWords(descriptionBox);  // Trigger the fade-in effect
};

    // Call the function to show 2017 chart and description by default
    updateChart(2017);  // This will trigger the default view to show 2017's pie chart and description

    // Initialize the 2017 button as active
    document.getElementById("button2017").classList.add("active");
}).catch(function(error) {
    console.error('Error loading the CSV file:', error);
});

// Arc transition function for entering and updating
function arcTween(a) {
    const i = d3.interpolate(this._current, a); // Interpolate the current arc to the new arc
    this._current = i(0); // Store the new current arc
    return function(t) {
        return arc(i(t)); // Return the path at the interpolated point
    };
}

// Arc transition function for exiting
function arcTweenExit(a) {
    const i = d3.interpolate(this._current, a); // Interpolate for exit transition
    return function(t) {
        return arc(i(t)); // Return the path at the interpolated point
    };
}
