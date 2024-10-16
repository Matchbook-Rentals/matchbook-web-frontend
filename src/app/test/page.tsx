import React from "react";
import prisma from "@/lib/prismadb";

// import React from "react";
import "./styles.css";
import ProgressBar from "./progress-bar";

export default async function HostDashboard() {
  return (
    <div className="web-landlord">
      <div className="overlap">
        <img className="path" alt="Path" src="/img/path-28.svg" />
        <img className="img" alt="Path" src="/img/path-29.svg" />
        <div className="profile-menu">
          <div className="drop-down-menu">
            <div className="group">
              <img
                className="drop-shadow-botton"
                alt="Drop shadow botton"
                src="/img/drop-shadow-botton.svg"
              />
              <img className="line" alt="Line" src="/img/line-6.svg" />
              <img
                className="drop-shadow-middle"
                alt="Drop shadow middle"
                src="/img/drop-shadow-botton.svg"
              />
              <img className="line-2" alt="Line" src="/img/line-6.svg" />
              <img
                className="drop-shadow-top"
                alt="Drop shadow top"
                src="/img/drop-shadow-botton.svg"
              />
              <img className="line-3" alt="Line" src="/img/line-6.svg" />
            </div>
          </div>
          <div className="profile-icon">
            <ProgressBar steps={5} currentStep={2} />
            <img
              className="drop-shadow-profile"
              alt="Drop shadow profile"
              src="/img/drop-shadow-profile.png"
            />
            <div className="overlap-group">
              <div className="ellipse" />
              <img
                className="overlap-group"
                alt="Group"
                src="/img/group-3.png"
              />
            </div>
          </div>
        </div>
        <img
          className="drop-shadow-box"
          alt="Drop shadow box"
          src="/img/drop-shadow-box.png"
        />
        <div className="profile-menu">
          <div className="drop-down-menu">
            <div className="group">
              <img
                className="drop-shadow-botton"
                alt="Drop shadow botton"
                src="/img/drop-shadow-botton-1.svg"
              />
              <img className="line" alt="Line" src="public/img/line-6-1.svg" />
              <img
                className="drop-shadow-middle"
                alt="Drop shadow middle"
                src="/img/drop-shadow-botton-1.svg"
              />
              <img className="line-2" alt="Line" src="/img/line-6-1.svg" />
              <img
                className="drop-shadow-top"
                alt="Drop shadow top"
                src="/img/drop-shadow-botton-1.svg"
              />
              <img className="line-3" alt="Line" src="/img/line-6-1.svg" />
            </div>
          </div>
          <div className="profile-icon">
            <img
              className="drop-shadow-profile"
              alt="Drop shadow profile"
              src="/img/drop-shadow-profile.png"
            />
            <div className="overlap-group">
              <div className="ellipse" />
              <img
                className="overlap-group"
                alt="Group"
                src="/img/group-3.png"
              />
            </div>
          </div>
        </div>
        <div className="group-wrapper">
          <div className="div">
            <div className="overlap-group-2">
              <div className="text-wrapper">{""}</div>
              <p className="match-book">
                <span className="span">M</span>
                <span className="text-wrapper-2">a</span>
                <span className="span">tchBook</span>
              </p>
            </div>
            <img className="path-2" alt="Path" src="/img/path-5.svg" />
          </div>
        </div>
        <div className="heart-lines">
          <img className="line-4" alt="Line" src="/img/line-7.svg" />
          <img className="line-5" alt="Line" src="/img/line-8.svg" />
          <img className="group-2" alt="Group" src="/img/group-48.png" />
          <div className="path-3" />
        </div>
        <img
          className="drop-shadow-box-2"
          alt="Drop shadow box"
          src="/img/drop-shadow-box-1.png"
        />
        <p className="your-properties">
          <span className="text-wrapper-3">Your Proper</span>
          <span className="text-wrapper-4">ties</span>
        </p>
        <img className="path-4" alt="Path" src="/img/path-63.svg" />
        <div className="rectangle" />
        <div className="text-wrapper-5">All (3)</div>
        <p className="for-rent">
          <span className="text-wrapper-3">For rent (1</span>
          <span className="text-wrapper-6">)</span>
        </p>
        <div className="text-wrapper-7">Rented (2)</div>
        <div className="rectangle-2" />
        <div className="rectangle-3" />
        <div className="group-3">
          <div className="rectangle-4" />
          <div className="rectangle-5" />
          <div className="rectangle-6" />
          <div className="rectangle-7" />
        </div>
        <div className="group-4">
          <div className="rectangle-8" />
          <div className="rectangle-9" />
          <div className="rectangle-10" />
          <img className="line-6" alt="Line1" src="/img/line-21.svg" />
          <img className="line-7" alt="Line" src="/img/line-22.svg" />
          <img className="line-8" alt="Line" src="/img/line-21.svg" />
        </div>
        <div className="overlap-wrapper">
          <div className="overlap-2">
            <div className="overlap-group-3">
              <p className="ogden-mountain-home">
                <span className="text-wrapper-3">Ogden Mount</span>
                <span className="text-wrapper-8">
                  ain Home
                  <br />
                </span>
              </p>
              <p className="element-quincy-ave">
                <span className="text-wrapper-3">2155 Quincy</span>
                <span className="text-wrapper-9"> Ave</span>
              </p>
            </div>
            <img
              className="screenshot"
              alt="Screenshot"
              src="/img/screenshot-2024-03-13-at-6-48-12-pm.png"
            />
            <div className="div-wrapper">
              <div className="text-wrapper-10">FOR RENT</div>
            </div>
          </div>
        </div>
        <div className="overlap-group-wrapper">
          <div className="overlap-2">
            <div className="overlap-group-3">
              <p className="ogden-mountain-home">
                <span className="text-wrapper-3">Ogden Mount</span>
                <span className="text-wrapper-8">
                  ain Home
                  <br />
                </span>
              </p>
              <p className="element-quincy-ave">
                <span className="text-wrapper-3">2155 Quincy</span>
                <span className="text-wrapper-9"> Ave</span>
              </p>
            </div>
            <img
              className="screenshot"
              alt="Screenshot"
              src="/img/screenshot-2024-03-13-at-6-48-12-pm.png"
            />
            <div className="div-wrapper">
              <div className="text-wrapper-11">RENTED</div>
            </div>
          </div>
        </div>
        <div className="group-5">
          <div className="overlap-2">
            <div className="overlap-group-3">
              <p className="ogden-mountain-home">
                <span className="text-wrapper-3">Ogden Mount</span>
                <span className="text-wrapper-8">
                  ain Home
                  <br />
                </span>
              </p>
              <p className="element-quincy-ave">
                <span className="text-wrapper-3">2155 Quincy</span>
                <span className="text-wrapper-9"> Ave</span>
              </p>
            </div>
            <img
              className="screenshot"
              alt="Screenshot"
              src="/img/screenshot-2024-03-13-at-6-48-12-pm.png"
            />
            <div className="div-wrapper">
              <div className="text-wrapper-11">RENTED</div>
            </div>
          </div>
        </div>
        <p className="add-a-property">
          <span className="text-wrapper-3">Add a prope</span>
          <span className="text-wrapper-6">rty</span>
        </p>
        <div className="ellipse-2" />
        <div className="text-wrapper-12">+</div>
      </div>
    </div>
  );
}
