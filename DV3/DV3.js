const margin = { top: 20, right: 40, bottom: 60, left: 80 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;  // Adjusted height for the chart

const svg = d3.select("svg.chart")
  .append("g")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

const tooltip = d3.select("#tooltip");

d3.csv("LineChart.csv").then(function(data) {
  data.forEach(d => {
    d.Year = +d.Year;
    d.TotalValue = +d.TotalValue;
  });

  const x = d3.scaleLinear()
    .domain(d3.extent(data, d => d.Year))
    .range([0, width]);

  const customYScale = d3.scaleLinear()
    .domain([0, 1, 2, 5, 10, 15, 20, 25])
    .range([height, height * 0.7, height * 0.5, height * 0.4, height * 0.2, height * 0.1, height * 0.05, 0]);

  // Add Y axis
  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(customYScale)
      .ticks(10)
      .tickValues([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25])
    );

  // Add X axis
  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

  // Add horizontal gridlines
  svg.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(customYScale.ticks(10))
    .enter().append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => customYScale(d))
    .attr("y2", d => customYScale(d));

  // Add vertical gridlines
  svg.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(x.ticks(10))
    .enter().append("line")
    .attr("x1", d => x(d))
    .attr("x2", d => x(d))
    .attr("y1", 0)
    .attr("y2", height);

  const countries = d3.group(data, d => d.Country);

  const colorScale = d3.scaleOrdinal()
    .domain(d3.range(25))  // Set the domain to have 25 data points
    .range([
        "#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
        "#f1f1f1", "#f2a1a1", "#ab7cb0", "#da643a", "#9bdc57", "#3d729b", "#ad6ea0", "#84593c", "#9cae51", "#bada55",
        "#ffaf29", "#7c1f53", "#80c2b6", "#5d3e62", "#e28a2b"
    ]);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => customYScale(d.TotalValue));

  // Add lines for each country
  countries.forEach((countryData, country) => {
    const countryLine = svg.append("path")
      .data([countryData])
      .attr("class", "line")
      .attr("stroke", colorScale(country))
      .attr("d", line)
      .attr("id", country.replace(/\s+/g, '_'))
      .append("title")
      .text(country);

    // Tooltip events for lines
    countryLine.on("mouseover", function(event, d) {
      const firstPoint = d[0];
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`Country: ${country}<br>Year: ${firstPoint.Year}<br>Value: ${firstPoint.TotalValue}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    }).on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0);
    });
  });

  // Add scatter plot circles
  svg.selectAll("circle")
    .data(data)
    .enter().append("circle")
    .attr("cx", d => x(d.Year))
    .attr("cy", d => customYScale(d.TotalValue))
    .attr("r", 5)
    .attr("fill", d => colorScale(d.Country))
    .on("mouseover", function(event, d) {
      const samePosition = data.filter(point => 
        point.Year === d.Year && point.TotalValue === d.TotalValue
      );
      
      const countriesAtPosition = samePosition.map(p => p.Country).join(", ");
      
      tooltip.transition().duration(200).style("opacity", .9);
      tooltip.html(`Country(s): ${countriesAtPosition}<br>Year: ${d.Year}<br>Value: ${d.TotalValue}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function() {
      tooltip.transition().duration(200).style("opacity", 0);
    });

  // Add labels to the axes
  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", 0 - margin.left + 50)
    .attr("x", 0 - (height / 2))
    .style("text-anchor", "middle")
    .text("Value Rate");

  svg.append("text")
    .attr("transform", "translate(" + (width / 2) + "," + (height + margin.top + 25) + ")")
    .style("text-anchor", "middle")
    .text("Year");

  // Add the legend
  const legend = d3.select("#legend");
  
  countries.forEach((countryData, country) => {
    const legendItem = legend.append("div")
      .attr("class", "legend-item");
    
    legendItem.append("div")
      .attr("class", "legend-box")
      .style("background-color", colorScale(country)); // Set box color based on country
    
    legendItem.append("span")
      .text(country); // Country name in legend
  });

}).catch(function(error) {
  console.error("Error loading or parsing the CSV file:", error);
});
