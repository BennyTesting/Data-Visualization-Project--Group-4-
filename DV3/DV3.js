const margin = { top: 20, right: 40, bottom: 60, left: 80 };
const width = 900 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

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

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(customYScale)
      .ticks(10)
      .tickValues([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25])
    );

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")));

  svg.append("g")
    .attr("class", "grid")
    .selectAll("line")
    .data(customYScale.ticks(10))
    .enter().append("line")
    .attr("x1", 0)
    .attr("x2", width)
    .attr("y1", d => customYScale(d))
    .attr("y2", d => customYScale(d));

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
    .domain(d3.range(25))
    .range(["#1f77b4", "#ff7f0e", "#2ca02c", "#d62728", "#9467bd", "#8c564b", "#e377c2", "#7f7f7f", "#bcbd22", "#17becf",
            "#f1f1f1", "#f2a1a1", "#ab7cb0", "#da643a", "#9bdc57", "#3d729b", "#ad6ea0", "#84593c", "#9cae51", "#bada55",
            "#ffaf29", "#7c1f53", "#80c2b6", "#5d3e62", "#e28a2b"]);

  const line = d3.line()
    .x(d => x(d.Year))
    .y(d => customYScale(d.TotalValue));

  countries.forEach((countryData, country) => {
    const countryLine = svg.append("path")
      .data([countryData])
      .attr("class", "line")
      .attr("stroke", colorScale(country))
      .attr("d", line)
      .attr("id", country.replace(/\s+/g, '_'))
      .append("title")
      .text(country);

    svg.selectAll("circle." + country.replace(/\s+/g, '_'))
      .data(countryData)
      .enter().append("circle")
      .attr("cx", d => x(d.Year))
      .attr("cy", d => customYScale(d.TotalValue))
      .attr("r", 5)
      .attr("fill", colorScale(country))
      .attr("class", "dot " + country.replace(/\s+/g, '_'))
      .style("opacity", 0.7);
  });

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

  const legend = d3.select("#legend");

  countries.forEach((countryData, country) => {
    const legendItem = legend.append("div")
      .attr("class", "legend-item")
      .attr("data-country", country)
      .on("mouseover", function(event) {
        const countryLine = svg.select(`#${country.replace(/\s+/g, '_')}`);
        const countryDots = svg.selectAll("circle." + country.replace(/\s+/g, '_'));

        d3.selectAll(".line").attr("opacity", 0.15);
        countryLine.attr("stroke-width", 6).attr("opacity", 1); // Reduced stroke width
        countryDots.style("opacity", 1);

        countryDots.each(function(d) {
          svg.append("foreignObject")
            .attr("x", x(d.Year) + 10)
            .attr("y", customYScale(d.TotalValue) - 15)
            .attr("width", 110) /* Reduced width */
            .attr("height", 35) /* Reduced height */
            .attr("class", "data-label-box")
            .html(`
              <div style="
                background-color: #fff;
                border: 1px solid ${colorScale(country)};
                border-radius: 4px;
                padding: 3px;
                font-size: 10px; /* Reduced font size */
                text-align: center;
                box-shadow: 0px 2px 4px rgba(0,0,0,0.2);
                ">
                <strong>${country}</strong><br>
                Year: ${d.Year}, Value: ${d.TotalValue}
              </div>
            `);
        });

        d3.select(this).classed("active", true).style("transform", "scale(1.1)");
      })
      .on("mouseout", function() {
        const countryLine = svg.select(`#${country.replace(/\s+/g, '_')}`);
        const countryDots = svg.selectAll("circle." + country.replace(/\s+/g, '_'));

        d3.selectAll(".line").attr("opacity", 1);
        countryLine.attr("stroke-width", 2).attr("opacity", 0.7);
        countryDots.style("opacity", 0.7);

        svg.selectAll(".data-label-box").remove();

        d3.select(this).classed("active", false).style("transform", "scale(1)");
      });

    legendItem.append("div")
      .attr("class", "legend-box")
      .style("background-color", colorScale(country));

    legendItem.append("span")
      .text(country);
  });

}).catch(function(error) {
  console.error("Error loading or parsing the CSV file:", error);
});
