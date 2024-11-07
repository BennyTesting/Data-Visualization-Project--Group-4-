// Set the dimensions and margin for the chart
const width = 1000;
const height = 628;
const margin = 1;

const customColorPalette = [
    "#5699d2", "#ff9b42", "#4cb65b", "#ff5b5b", "#9f81e5", "#b17c64",
    "#f1a6da", "#a1a1a1", "#d7d95d", "#78d7e3", "#c238e0", "#56a8f5",
    "#58cce1", "#7edc7e", "#f5f975", "#ff8355", "#9e7f4e", "#7f96b7",
    "#bdbdbd", "#ff6f6f", "#7f60e0", "#6e76f0", "#9bdd74", "#d5e17f",
    "#ffbc6b", "#c6c6c6", "#f2b2d0", "#56a8f5", "#e86fa9", "#4c3e42",
    "#6e6a49", "#7cc2a0", "#7f9b3b", "#e5e07c", "#ee9c33", "#d57d6d",
    "#3aa99a", "#6c7af0", "#9f81e5", "#58cce1"
];

const color = d3.scaleOrdinal(customColorPalette)
    .domain(d3.range(40));

// Set up the pack layout
const pack = d3.pack()
    .size([width - margin * 2, height - margin * 2])
    .padding(3);

// Initialize the global data
let globalData;

// Load the data from CSV and format it
d3.csv("Living_With_HIV.csv").then(function(data) {
    globalData = data;
    // Format the data to fit the hierarchical structure
    updateYear("2017"); // This will trigger the chart for 2017 and set the button active
});

// Function to update the chart based on the selected year
function updateYear(year) {
    // Add active class to the clicked button
    const buttons = document.querySelectorAll('.button');
    buttons.forEach(button => button.classList.remove('active'));
    document.querySelector(`button[onclick="updateYear('${year}')"]`).classList.add('active');
    
    updateChart(year);
}

// Function to create the bubble chart for a given year
function updateChart(year) {
    const rootData = {
        name: "LivingWithHIV",
        children: globalData.map(d => ({
            id: d.Country,
            value: +d[year],
            group: d.Code,
            name: d.Country
        }))
    };

    const root = pack(d3.hierarchy(rootData)
        .sum(d => d.value));

    const svg = d3.select("svg")
        .attr("viewBox", [-margin, -margin, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 10px sans-serif;")
        .attr("text-anchor", "middle");

    svg.selectAll("*").remove();

    const node = svg.append("g")
        .selectAll("g")
        .data(root.leaves())
        .join("g")
        .attr("class", "bubble")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("title")
        .text(d => `${d.data.name}\n${d3.format(",d")(d.value)}`);

    const circle = node.append("circle")
        .attr("fill-opacity", 0.7)
        .attr("fill", d => color(d.data.group))
        .attr("r", 0);

    const text = node.append("text")
        .attr("clip-path", d => `circle(${d.r})`)
        .attr("fill-opacity", 0);

    text.selectAll()
        .data(d => d.data.name.split(/(?=[A-Z][a-z])/))  
        .join("tspan")
        .attr("x", 0)
        .attr("y", (d, i, nodes) => `${i - nodes.length / 2 + 0.35}em`)
        .text(d => d);

    text.append("tspan")
        .attr("x", 0)
        .attr("y", d => `${d.data.name.split(/(?=[A-Z][a-z])/).length / 2 + 0.35}em`)
        .attr("fill-opacity", 0.7)
        .text(d => d3.format(",d")(d.value));

    circle.transition()
        .duration(1500)
        .ease(d3.easeElasticOut)
        .attr("r", d => d.r);

    text.transition()
        .duration(1500)
        .ease(d3.easeElasticOut)
        .attr("fill-opacity", 1);

    node.transition()
        .duration(1500)
        .ease(d3.easeElasticOut)
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.on("mouseover", function (event, d) {
        const scaleFactor = d.value < 1500 ? 2 : 1.2;
        d3.select(this).select("circle")
            .transition()
            .duration(300)
            .attr("r", d.r * scaleFactor);

        d3.select(this).select("text")
            .transition()
            .duration(300)
            .attr("fill-opacity", 1);
    })
    .on("mouseout", function (event, d) {
        d3.select(this).select("circle")
            .transition()
            .duration(300)
            .attr("r", d.r);

        d3.select(this).select("text")
            .transition()
            .duration(300);
    });
}
