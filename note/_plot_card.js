function get_data(func_of_x_as_str) {
  // Generate data
  const data = {
    labels: [],
    datasets: [
      {
        // label: "y = x^2 + 3x - 4",
        data: [],
        fill: false,
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
        pointRadius: 0, // Hide the points
      },
    ],
  };

  // Define your function
  // function yourFunction(x) {
  //   return x ** 2 + 3 * x - 4;
  // }
  const yourFunction = new Function("x", `return ${func_of_x_as_str};`);

  // Populate the data
  for (let x = -10; x <= 10; x += 0.125) {
    data.labels.push(x);
    data.datasets[0].data.push(yourFunction(x));
  }
  console.log(data.labels);
  return data;
}

function get_config(data) {
  const axes_color = "rgba(0.5, 0.5, 0.5, 0.5)";
  const grid_color = "rgba(0, 0, 0, 0.1)";
  const config = {
    type: "line",
    data: data,
    options: {
      animation: false,
      scales: {
        y: {
          beginAtZero: false,
          min: -10,
          max: 10,
          ticks: {
            stepSize: 1,
          },
          grid: {
            drawBorder: true,
            color: function (context) {
              if (context.tick.value === 0) {
                return axes_color; // Darker line for x-axis
              }
              return grid_color;
            },
            lineWidth: function (context) {
              if (context.tick.value === 0) {
                return 2; // Thicker line for x-axis
              }
              return 1;
            },
          },
        },
        x: {
          beginAtZero: true,
          ticks: {
            // Define a callback for ticks to display only integers
            callback: function (value, index, values) {
              if (this.getLabelForValue(value) % 1 === 0) {
                return this.getLabelForValue(value);
              }
            },
            stepSize: 1,
          },
          grid: {
            drawBorder: true,
            color: function (context) {
              if (context.tick.value === 80) {
                return axes_color; // Darker line for y-axis
              }
              return grid_color;
            },
            lineWidth: function (context) {
              if (context.tick.value === 80) {
                return 2; // Thicker line for y-axis
              }
              return 1;
            },
          },
        },
      },
      plugins: {
        legend: {
          display: false,
        },
      },
    },
  };
  return config;
}
