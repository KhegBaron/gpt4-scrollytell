/* ============================================================
   THE 90TH PERCENTILE THAT WASN'T
   D3.js visualization + scrollytelling behavior
   ============================================================ */

(() => {
  "use strict";

  // ============================================================
  // DATA: distributions for each step
  // Each state defines (mean, sd) for normal distributions
  // chosen so GPT-4's score (298) yields the target percentile
  // reported in Martínez (2024, Artif. Intell. Law)
  // ============================================================

  const GPT4_SCORE = 298;
  const PASS_LINE = 266; // typical UBE passing score
  const X_MIN = 170;
  const X_MAX = 400;

  const STATES = {
    1: {
      title: "Against February 2023 test-takers",
      subtitle: "OpenAI's original comparison pool",
      distributions: [
        { key: "feb", label: "February 2023 pool (mostly retakers)",
          mean: 260, sd: 30, color: "#c8601c", opacity: 0.78 }
      ],
      percentile: 90,
      percentileLabel: "GPT-4 ≈ 90th percentile"
    },
    2: {
      title: "Who takes the February exam?",
      subtitle: "Feb takers are mostly people who failed in July",
      distributions: [
        { key: "firstFeb", label: "First-time Feb takers (~25%)",
          mean: 270, sd: 24, color: "#3e5c76", opacity: 0.55, weight: 0.25 },
        { key: "repeatFeb", label: "Repeat takers (~75%)",
          mean: 248, sd: 26, color: "#c8601c", opacity: 0.78, weight: 0.75 }
      ],
      percentile: 90,
      percentileLabel: "GPT-4 still shows as 90th — but of a skewed pool"
    },
    3: {
      title: "Against all first-time takers",
      subtitle: "A broader, more representative population",
      distributions: [
        { key: "firstTime", label: "All first-time UBE takers",
          mean: 290, sd: 25, color: "#3e5c76", opacity: 0.78 }
      ],
      percentile: 62,
      percentileLabel: "GPT-4 ≈ 62nd percentile"
    },
    4: {
      title: "Against lawyers who actually passed",
      subtitle: "The population OpenAI's claim implicitly invoked",
      distributions: [
        { key: "passers", label: "Qualified attorneys (passed the bar)",
          mean: 300, sd: 20, color: "#a84b20", opacity: 0.85 }
      ],
      percentile: 48,
      percentileLabel: "GPT-4 ≈ 48th percentile — below median"
    }
  };

  // ============================================================
  // MATH: normal density + percentile
  // ============================================================

  const normalPdf = (x, mean, sd) =>
    (1 / (sd * Math.sqrt(2 * Math.PI))) *
    Math.exp(-0.5 * Math.pow((x - mean) / sd, 2));

  const sampleDensity = (mean, sd, nPoints = 200) => {
    const xs = d3.range(X_MIN, X_MAX + 1, (X_MAX - X_MIN) / nPoints);
    return xs.map(x => ({ x, y: normalPdf(x, mean, sd) }));
  };

  const mixtureDensity = (dists, nPoints = 200) => {
    const xs = d3.range(X_MIN, X_MAX + 1, (X_MAX - X_MIN) / nPoints);
    return xs.map(x => ({
      x,
      y: dists.reduce((sum, d) =>
        sum + (d.weight || 1) * normalPdf(x, d.mean, d.sd), 0)
    }));
  };

  // ============================================================
  // STATIC TEST DOMAIN (for stable y-scale across steps)
  // ============================================================

  // Find max density across all states to fix y-axis
  const getMaxDensity = () => {
    let max = 0;
    Object.values(STATES).forEach(state => {
      state.distributions.forEach(d => {
        const peak = normalPdf(d.mean, d.mean, d.sd) * (d.weight || 1);
        if (peak > max) max = peak;
      });
    });
    return max;
  };

  // ============================================================
  // CHART SETUP
  // ============================================================

  const svg = d3.select("#chart");
  const margin = { top: 20, right: 30, bottom: 55, left: 30 };
  const width = 800;
  const height = 440;
  const innerW = width - margin.left - margin.right;
  const innerH = height - margin.top - margin.bottom;

  svg.attr("viewBox", `0 0 ${width} ${height}`);
  const g = svg.append("g")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  // Scales
  const x = d3.scaleLinear()
    .domain([X_MIN, X_MAX])
    .range([0, innerW]);

  const y = d3.scaleLinear()
    .domain([0, getMaxDensity() * 1.15])
    .range([innerH, 0]);

  // Area generator
  const area = d3.area()
    .x(d => x(d.x))
    .y0(innerH)
    .y1(d => y(d.y))
    .curve(d3.curveCatmullRom.alpha(0.5));

  // ------------------------
  // Layer: pass line (static reference)
  // ------------------------
  g.append("line")
    .attr("class", "pass-line")
    .attr("x1", x(PASS_LINE))
    .attr("x2", x(PASS_LINE))
    .attr("y1", 0)
    .attr("y2", innerH);

  g.append("text")
    .attr("class", "reference-label")
    .attr("x", x(PASS_LINE))
    .attr("y", 12)
    .attr("text-anchor", "middle")
    .text("TYPICAL PASSING SCORE (266)");

  // ------------------------
  // Layer: distribution areas (dynamic)
  // ------------------------
  const densityGroup = g.append("g").attr("class", "density-group");

  // ------------------------
  // Layer: GPT-4 marker line
  // ------------------------
  const gptGroup = g.append("g").attr("class", "gpt-group");

  gptGroup.append("line")
    .attr("class", "gpt-line")
    .attr("x1", x(GPT4_SCORE))
    .attr("x2", x(GPT4_SCORE))
    .attr("y1", 0)
    .attr("y2", innerH);

  // A circle at bottom marking GPT-4's score
  gptGroup.append("circle")
    .attr("cx", x(GPT4_SCORE))
    .attr("cy", innerH)
    .attr("r", 6)
    .attr("fill", "#141110")
    .attr("stroke", "#faf7f2")
    .attr("stroke-width", 2);

  gptGroup.append("text")
    .attr("class", "gpt-marker-label")
    .attr("x", x(GPT4_SCORE))
    .attr("y", -6)
    .attr("text-anchor", "middle")
    .text("GPT-4 · score 298");

  // ------------------------
  // Layer: percentile badge (dynamic, floats over distribution peak)
  // ------------------------
  const badgeGroup = g.append("g").attr("class", "badge-group");

  const badge = badgeGroup.append("text")
    .attr("class", "percentile-badge")
    .attr("text-anchor", "end")
    .attr("fill", "#c8601c")
    .attr("x", innerW - 6)
    .attr("y", 50)
    .style("font-size", "66px")
    .text("90th");

  const badgeSub = badgeGroup.append("text")
    .attr("class", "percentile-badge-sub")
    .attr("text-anchor", "end")
    .attr("x", innerW - 6)
    .attr("y", 68)
    .text("PERCENTILE");

  // ------------------------
  // X axis
  // ------------------------
  const xAxis = d3.axisBottom(x)
    .tickValues([180, 220, 260, 300, 340, 380])
    .tickSize(6)
    .tickPadding(8);

  g.append("g")
    .attr("class", "axis axis--x")
    .attr("transform", `translate(0, ${innerH})`)
    .call(xAxis);

  g.append("text")
    .attr("class", "axis-label")
    .attr("x", innerW / 2)
    .attr("y", innerH + 45)
    .attr("text-anchor", "middle")
    .style("font-family", "'IBM Plex Mono', monospace")
    .style("font-size", "10px")
    .style("letter-spacing", "0.1em")
    .style("text-transform", "uppercase")
    .style("fill", "#6b635a")
    .text("UBE scaled score");


  // ============================================================
  // RENDER STATE
  // ============================================================

  function renderState(stateNum) {
    const state = STATES[stateNum];
    if (!state) return;

    // Title + subtitle
    const titleEl = document.getElementById("viz-title");
    const subtitleEl = document.getElementById("viz-subtitle");
    titleEl.textContent = state.title;
    subtitleEl.textContent = state.subtitle;

    // Distributions -- data join
    const areas = densityGroup.selectAll(".density-area")
      .data(state.distributions, d => d.key);

    // Exit
    areas.exit()
      .transition().duration(500)
      .style("opacity", 0)
      .remove();

    // Enter
    const areasEnter = areas.enter()
      .append("path")
      .attr("class", "density-area")
      .attr("fill", d => d.color)
      .style("opacity", 0)
      .attr("d", d => area(sampleDensity(d.mean, d.sd).map(p =>
        ({ x: p.x, y: p.y * (d.weight || 1) })
      )));

    // Update (including enter)
    areasEnter.merge(areas)
      .transition().duration(750)
      .ease(d3.easeCubicInOut)
      .style("opacity", d => d.opacity)
      .attr("fill", d => d.color)
      .attr("d", d => area(sampleDensity(d.mean, d.sd).map(p =>
        ({ x: p.x, y: p.y * (d.weight || 1) })
      )));

    // Percentile badge
    const pcolor = stateNum === 1 || stateNum === 2 ? "#c8601c" :
                   stateNum === 3 ? "#3e5c76" : "#a84b20";

    badge
      .transition().duration(600)
      .style("font-size", "66px")
      .attr("fill", pcolor)
      .tween("text", function () {
        const that = d3.select(this);
        const current = parseFloat(that.text()) || state.percentile;
        const interp = d3.interpolateNumber(current, state.percentile);
        return t => that.text(Math.round(interp(t)) + "th");
      });

    // Update legend
    renderLegend(state);

    // Update body step-card styling via data-state
    document.body.setAttribute("data-current-step", stateNum);
  }

  function renderLegend(state) {
    const legend = d3.select("#viz-legend");
    legend.html("");

    state.distributions.forEach(d => {
      const item = legend.append("div").attr("class", "legend-item");
      item.append("span")
        .attr("class", "legend-swatch")
        .style("background", d.color)
        .style("opacity", d.opacity);
      item.append("span").text(d.label);
    });
  }


  // ============================================================
  // SCROLLYTELLING: IntersectionObserver on steps
  // ============================================================

  const steps = document.querySelectorAll(".step");

  const stepObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.intersectionRatio > 0.55) {
        const stepNum = parseInt(entry.target.dataset.step, 10);

        // Mark active
        steps.forEach(s => s.classList.remove("is-active"));
        entry.target.classList.add("is-active");

        renderState(stepNum);
      }
    });
  }, {
    threshold: [0, 0.55, 1],
    rootMargin: "-20% 0px -20% 0px"
  });

  steps.forEach(step => stepObserver.observe(step));

  // Initial render (step 1)
  renderState(1);
  if (steps[0]) steps[0].classList.add("is-active");


  // ============================================================
  // NUMBER COUNT-UP for the big "90th" in the claim section
  // ============================================================

  const countUp = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1600;
    const start = performance.now();

    const tick = (now) => {
      const t = Math.min((now - start) / duration, 1);
      // Easing: easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  const countObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const bignum = entry.target.querySelector(".bignum");
        if (bignum && !bignum.dataset.counted) {
          countUp(bignum);
          bignum.dataset.counted = "true";
        }
        countObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll("[data-animate='count-up']").forEach(el => {
    countObserver.observe(el);
  });


  // ============================================================
  // GENERIC REVEAL on scroll (for timeline, cards, mismatches)
  // ============================================================

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-revealed");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll("[data-reveal]").forEach(el => {
    revealObserver.observe(el);
  });


  // ============================================================
  // Stagger reveals in a row (pretty effect)
  // ============================================================

  const stagger = (selector, delayStep = 120) => {
    document.querySelectorAll(selector).forEach((el, i) => {
      el.style.transitionDelay = `${i * delayStep}ms`;
    });
  };
  stagger(".mismatch", 130);
  stagger(".sociocard", 130);
  stagger(".bene__item", 90);
  stagger(".timeline__item", 90);

})();
