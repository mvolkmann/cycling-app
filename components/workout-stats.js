import Wrec, { css, html } from "./wrec.min.js";

class WorkoutStats extends Wrec {
  static properties = {
    totalMiles: { type: Number },
    totalTime: { type: Number },
    totalElevation: { type: Number },
    totalWorkouts: { type: Number },
  };

  static css = css`
    :host {
      display: block;
    }

    .workout-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 10px;
      margin-top: 20px;
    }

    .stat-card {
      background: #e9ecef;
      padding: 15px;
      border-radius: 5px;
      text-align: center;
    }

    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #007bff;
    }

    .stat-label {
      font-size: 14px;
      color: #666;
      margin-top: 5px;
    }
  `;

  static html = html`
    <h2>Workout Statistics</h2>
    <div class="workout-stats">
      <div class="stat-card">
        <div class="stat-value">this.totalMiles.toFixed(1)</div>
        <div class="stat-label">Total Miles</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">this.totalTime</div>
        <div class="stat-label">Total Minutes</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">this.totalElevation</div>
        <div class="stat-label">Total Elevation (ft)</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">this.totalWorkouts</div>
        <div class="stat-label">Total Workouts</div>
      </div>
    </div>
  `;

  connectedCallback() {
    super.connectedCallback();
    this.updateStats();
  }

  updateStats() {
    fetch("/api/stats")
      .then((response) => response.json())
      .then((stats) => {
        this.totalMiles = stats.totalMiles;
        this.totalTime = stats.totalTime;
        this.totalElevation = stats.totalElevation;
        this.totalWorkouts = stats.totalWorkouts;
      })
      .catch((error) => {
        console.error("Error fetching stats:", error);
      });
  }
}

WorkoutStats.register();
