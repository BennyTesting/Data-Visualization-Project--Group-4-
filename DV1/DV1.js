const chartContainer = d3.select("#chart");

const mainMargin = { top: 40, right: 30, bottom: 40, left: 50 },
    mainWidth = 800 - mainMargin.left - mainMargin.right,
    mainHeight = 400 - mainMargin.top - mainMargin.bottom;

const svg = chartContainer.append("svg")
    .attr("width", mainWidth + mainMargin.left + mainMargin.right)
    .attr("height", mainHeight + mainMargin.top + mainMargin.bottom)
    .append("g")
    .attr("transform", `translate(${mainMargin.left + 40},${mainMargin.top})`);

const x = d3.scaleBand().padding(0.2).range([0, mainWidth]);
const y = d3.scaleLinear().range([mainHeight, 0]);

const xAxis = svg.append("g")
    .attr("transform", `translate(0, ${mainHeight})`)
    .attr("class", "x-axis");

const yAxis = svg.append("g").attr("class", "y-axis");

const detailContainer = d3.select("#detail-chart");

const detailMargin = { top: 40, right: 30, bottom: 60, left: 100 },
    detailWidth = 1400 - detailMargin.left - detailMargin.right;
    detailHeight = 800 - detailMargin.top - detailMargin.bottom;

const detailSvg = detailContainer.append("svg")
    .attr("width", detailWidth + detailMargin.left + detailMargin.right)
    .attr("height", detailHeight + detailMargin.top + detailMargin.bottom)
    .append("g")
    .attr("transform", `translate(${detailMargin.left + 50},${detailMargin.top})`);

    const detailX = d3.scaleLinear().range([0, detailWidth * 0.8]);
const detailY = d3.scaleBand().padding(0.5).range([0, detailHeight]);

const detailXAxis = detailSvg.append("g")
    .attr("class", "x-axis")
    .attr("transform", `translate(0, ${detailHeight})`);

const detailYAxis = detailSvg.append("g")
    .attr("class", "y-axis");

let currentYear = 2017;
let currentHealthTopic = null; // Track selected health topic
let currentSortOrder = "none"; // Default sort order is "none"

d3.csv("Disease_By_Year.csv").then(data => {
    data.forEach(d => {
        d.Time = +d.Time;
        d.TotalValue = +d.TotalValue;
        d.Value = +d.Value || 0;
    });

    function updateChart(year) {
        currentYear = year;
        const filteredData = data.filter(d => d.Time === year);

        x.domain(filteredData.map(d => d.HealthTopic));
        y.domain([0, d3.max(filteredData, d => d.TotalValue)]);

        const bars = svg.selectAll(".bar").data(filteredData, d => d.HealthTopic);
        bars.exit().remove();

        bars
            .transition().duration(500)
            .attr("x", d => x(d.HealthTopic))
            .attr("y", d => y(d.TotalValue))
            .attr("height", d => mainHeight - y(d.TotalValue))
            .attr("width", x.bandwidth());

        const newBars = bars.enter().append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.HealthTopic))
            .attr("y", y(0))
            .attr("height", 0)
            .attr("width", x.bandwidth())
            .on("mouseover", function () { d3.select(this).attr("fill", "orange"); })
            .on("mouseout", function () { d3.select(this).attr("fill", "steelblue"); })
            .on("click", function (event, d) {
                currentHealthTopic = d.HealthTopic; // Update current health topic on click
                showDetailChart(d.HealthTopic, currentYear);
            })
            .transition().duration(500)
            .attr("y", d => y(d.TotalValue))
            .attr("height", d => mainHeight - y(d.TotalValue));

        const labels = svg.selectAll(".label").data(filteredData, d => d.HealthTopic);
        labels.exit().remove();

        labels
            .transition().duration(500)
            .attr("x", d => x(d.HealthTopic) + x.bandwidth() / 2)
            .attr("y", d => y(d.TotalValue) - 5)
            .text(d => d.TotalValue);

        labels.enter().append("text")
            .attr("class", "label")
            .attr("x", d => x(d.HealthTopic) + x.bandwidth() / 2)
            .attr("y", d => y(d.TotalValue) - 5)
            .attr("text-anchor", "middle")
            .style("fill", "black")
            .style("font-size", "12px")
            .text(d => d.TotalValue)
            .merge(labels)
            .transition().duration(500)
            .attr("y", d => y(d.TotalValue) - 5);

        xAxis.transition().duration(500).call(d3.axisBottom(x).tickSize(0));
        yAxis.transition().duration(500).call(d3.axisLeft(y));

        detailSvg.selectAll(".detail-bar").remove();
        detailXAxis.selectAll("*").remove();
        detailYAxis.selectAll("*").remove();
        detailContainer.style("display", "none");
    }

    function showDetailChart(healthTopic, year, sortOrder = "none") {
        d3.csv("BarChart.csv").then(barData => {
            barData.forEach(d => {
                d.Value = +d.Value || 0;
                d.Time = +d.Time;
            });

            let detailData = barData.filter(d => d.HealthTopic === healthTopic && d.Time === year);

            // Apply sorting if sortOrder is not "none"
            if (sortOrder !== "none") {
                detailData.sort((a, b) => sortOrder === "asc" ? a.Value - b.Value : b.Value - a.Value);
            }

            detailContainer.style("display", "block");

            detailSvg.selectAll(".year-label").remove();

            detailSvg.append("text")
                .attr("class", "year-label")
                .attr("x", detailWidth / 2 - 120)
                .attr("y", -10)
                .attr("text-anchor", "middle")
                .style("font-size", "16px")
                .selectAll("tspan")
                .data([{
                    text: "Data for ", bold: false
                }, { text: healthTopic, bold: true }, {
                    text: " Based on Country in ", bold: false
                }, { text: year, bold: true }])
                .enter().append("tspan")
                .attr("font-weight", d => d.bold ? "bold" : "normal")
                .text(d => d.text);

            detailX.domain([0, d3.max(detailData, d => d.Value) * 1.5]);
            detailY.domain(detailData.map(d => d.RegionName));

            const detailBars = detailSvg.selectAll(".detail-bar").data(detailData, d => d.RegionName);
            detailBars.exit().remove();

            detailBars.transition().duration(500)
                .attr("x", 0)
                .attr("y", d => detailY(d.RegionName))
                .attr("width", d => detailX(d.Value))
                .attr("height", detailY.bandwidth());

            detailBars.enter().append("rect")
                .attr("class", "detail-bar")
                .attr("x", 0)
                .attr("y", detailY(0))
                .attr("width", 0)
                .attr("height", detailY.bandwidth())
                .attr("fill", "steelblue")
                .transition().duration(500)
                .attr("y", d => detailY(d.RegionName))
                .attr("width", d => detailX(d.Value));

            const detailLabels = detailSvg.selectAll(".detail-label").data(detailData, d => d.RegionName);
            detailLabels.exit().remove();

            detailLabels.transition().duration(500)
                .attr("x", d => detailX(d.Value) + 5)
                .attr("y", d => detailY(d.RegionName) + detailY.bandwidth() / 2)
                .attr("dy", ".35em")
                .style("font-size", "12px")
                .style("fill", "black")
                .text(d => d.Value);

            detailLabels.enter().append("text")
                .attr("class", "detail-label")
                .attr("x", d => detailX(d.Value) + 5)
                .attr("y", d => detailY(d.RegionName) + detailY.bandwidth() / 2)
                .attr("dy", ".35em")
                .style("font-size", "12px")
                .style("fill", "black")
                .text(d => d.Value);

            detailXAxis.transition().duration(500).call(d3.axisBottom(detailX).ticks(15));
            detailYAxis.transition().duration(500).call(d3.axisLeft(detailY));
        });
    }

    d3.selectAll("button").on("click", function () {
        const year = +this.textContent;
        currentYear = year;
        d3.selectAll("button").classed("active", false);
        d3.select(this).classed("active", true);
        updateChart(year);
    });

    d3.select("#sort-asc").on("click", () => {
        currentSortOrder = "asc"; // Set sort order to ascending
        showDetailChart(currentHealthTopic, currentYear, currentSortOrder);
    });
    d3.select("#sort-desc").on("click", () => {
        currentSortOrder = "desc"; // Set sort order to descending
        showDetailChart(currentHealthTopic, currentYear, currentSortOrder);
    });

        // Ensure the 2017 button is active on page load
        d3.selectAll("button").classed("active", false); // Remove active class from all buttons
        d3.select("button").filter(function() {
            return d3.select(this).text() === "2017"; // Select the button with the text 2017
        }).classed("active", true); // Add active class to the 2017 button

    updateChart(2017); // Initial chart update
});
