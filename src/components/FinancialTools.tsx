/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { TrendingUp, PieChart, Percent, IndianRupee } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// Helper to format currency
const fmtCurrency = (val: number) => {
  return val.toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Shorthand formatter for chart Y-axis (adds Lakhs/Crores standard Indian notation)
const formatYAxis = (value: number) => {
  if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)} Cr`;
  if (value >= 100000) return `₹${(value / 100000).toFixed(1)} L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(1)} k`;
  return `₹${value}`;
};

// Custom chart tooltip component
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3.5 border border-slate-100 rounded-xl shadow-lg space-y-1.5 text-xs">
        <p className="font-bold text-slate-700 font-sans mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6">
            <span className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span 
                className="w-2 h-2 rounded-full inline-block" 
                style={{ backgroundColor: entry.color }}
              />
              {entry.name}:
            </span>
            <span className="font-mono font-bold text-slate-800">
              {fmtCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEMATIC INVESTMENT PLAN (SIP) CALCULATOR
// ─────────────────────────────────────────────────────────────────────────────
export function SipCalculator() {
  const [monthly, setMonthly] = useState(2500); // Standard starting amount (default: ₹2500)
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(15);
  
  // Step Up Parameters State
  const [isStepUp, setIsStepUp] = useState(false);
  const [stepUpType, setStepUpType] = useState<"percent" | "amount">("percent");
  const [stepUpValue, setStepUpValue] = useState(10); // Default: 10% or ₹500
  const [stepUpFrequency, setStepUpFrequency] = useState(12); // Every Year (12 months) or 6 months (6)

  const [invested, setInvested] = useState(0);
  const [returns, setReturns] = useState(0);
  const [maturity, setMaturity] = useState(0);
  const [chartData, setChartData] = useState<{
    name: string;
    "Total Invested": number;
    "Total Wealth": number;
  }[]>([]);

  useEffect(() => {
    const totalMonths = years * 12;
    const monthlyRate = (rate / 100) / 12;

    let totalWealth = 0;
    let totalInvested = 0;
    let currentMonthly = monthly;

    const points: { name: string; "Total Invested": number; "Total Wealth": number }[] = [];

    // Starting Point
    points.push({
      name: "Start",
      "Total Invested": 0,
      "Total Wealth": 0,
    });

    for (let m = 1; m <= totalMonths; m++) {
      // 1. Contribution added at beginning of month
      totalWealth += currentMonthly;
      totalInvested += currentMonthly;

      // 2. Compounding interest calculated at end of month
      totalWealth += totalWealth * monthlyRate;

      // 3. Step Up applied after stepUpFrequency months
      if (isStepUp && m % stepUpFrequency === 0 && m < totalMonths) {
        if (stepUpType === "percent") {
          currentMonthly = currentMonthly * (1 + stepUpValue / 100);
        } else {
          currentMonthly = currentMonthly + stepUpValue;
        }
      }

      // Record a data point at periodic intervals to draw a smooth, clean curve
      const shouldPush = 
        (years <= 2 && m % 3 === 0) || 
        (years > 2 && years <= 5 && m % 6 === 0) ||
        (years > 5 && m % 12 === 0) ||
        m === totalMonths;

      if (shouldPush) {
        const periodLabel = m % 12 === 0 
          ? `Year ${m / 12}` 
          : `${Math.floor(m / 12)}Yr ${m % 12}Mo`;
        
        points.push({
          name: periodLabel,
          "Total Invested": Math.round(totalInvested),
          "Total Wealth": Math.round(totalWealth),
        });
      }
    }

    const estimatedReturns = Math.max(0, totalWealth - totalInvested);

    setInvested(totalInvested);
    setReturns(estimatedReturns);
    setMaturity(totalWealth);
    setChartData(points);
  }, [monthly, rate, years, isStepUp, stepUpType, stepUpValue, stepUpFrequency]);

  return (
    <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-2xl shadow-sm space-y-6">
      <div className="border-b border-slate-100 pb-4 flex items-center gap-2.5">
        <TrendingUp className="h-5 w-5 text-blue-600" />
        <span className="text-xs font-mono text-blue-650 font-bold uppercase tracking-widest">// SIP compounding engine with Step-up mode</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">Initial Monthly Investment (₹)</label>
          <input
            type="number"
            value={monthly}
            onChange={(e) => setMonthly(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">Expected Return Rate (% p.a.)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">Tenure duration (years)</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* Step Up Activation Checkbox */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
        <input
          id="step-up-toggle"
          type="checkbox"
          checked={isStepUp}
          onChange={(e) => {
            setIsStepUp(e.target.checked);
            // Reset to reasonable defaults if selecting first time
            if (e.target.checked && stepUpValue === 10 && stepUpType === "percent") {
              setStepUpValue(10);
            }
          }}
          className="h-4.5 w-4.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
        />
        <label htmlFor="step-up-toggle" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
          Enable Step-up Mode (Increase investment contribution regularly)
        </label>
      </div>

      {/* Step Up Controls */}
      {isStepUp && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-5 bg-blue-50/40 border border-blue-100 rounded-xl transition-all">
          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">Step-up Type</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setStepUpType("percent");
                  setStepUpValue(10);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                  stepUpType === "percent"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Percentage (%)
              </button>
              <button
                type="button"
                onClick={() => {
                  setStepUpType("amount");
                  setStepUpValue(500);
                }}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition ${
                  stepUpType === "amount"
                    ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                    : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                Fixed Amount (₹)
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">
              {stepUpType === "percent" ? "Step-up Percentage (%)" : "Step-up Amount (₹)"}
            </label>
            <input
              type="number"
              value={stepUpValue}
              onChange={(e) => setStepUpValue(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-sans font-bold text-slate-500 uppercase tracking-wider">Step-up Frequency</label>
            <select
              value={stepUpFrequency}
              onChange={(e) => setStepUpFrequency(parseInt(e.target.value, 10))}
              className="w-full bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-xs font-sans focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value={12}>Every Year (12 months)</option>
              <option value={6}>Every 6 Months (6 months)</option>
            </select>
          </div>
        </div>
      )}

      {/* Numerical Yield Results */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
          <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Invested Capital</span>
          <span className="text-base font-mono font-bold text-slate-800">{fmtCurrency(invested)}</span>
        </div>
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
          <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5">Estimated Gains Yield</span>
          <span className="text-base font-mono font-bold text-blue-600">{fmtCurrency(returns)}</span>
        </div>
        <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl">
          <span className="block text-[10px] font-sans font-bold text-slate-400 uppercase tracking-widest mb-1.5">Total Projected Wealth</span>
          <span className="text-base font-mono font-bold text-green-700">{fmtCurrency(maturity)}</span>
        </div>
      </div>

      {/* Visual Chart Accumulation Growth */}
      {chartData.length > 1 && (
        <div className="bg-slate-50 border border-slate-100 p-4 sm:p-6 rounded-2xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/50 pb-3">
            <div>
              <span className="text-[10px] font-sans font-bold text-slate-450 uppercase tracking-widest block">Accumulation Chart</span>
              <h4 className="text-xs font-sans font-semibold text-slate-700">Wealth Growth Trajectory over {years} Years</h4>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-sans">
              <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                <span className="w-2.5 h-2.5 bg-slate-400 rounded-sm inline-block"></span>
                Invested ({formatYAxis(invested)})
              </span>
              <span className="flex items-center gap-1.5 text-blue-600 font-medium">
                <span className="w-2.5 h-2.5 bg-blue-600 rounded-sm inline-block"></span>
                Wealth Pool ({formatYAxis(maturity)})
              </span>
            </div>
          </div>

          <div className="w-full h-72 sm:h-80 select-text">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={formatYAxis}
                  tick={{ fill: '#94A3B8', fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  width={75}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#E2E8F0', strokeWidth: 1 }} />
                <Line 
                  name="Total Invested"
                  type="monotone" 
                  dataKey="Total Invested" 
                  stroke="#94A3B8" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 0, fill: '#64748B' }}
                />
                <Line 
                  name="Total Wealth"
                  type="monotone" 
                  dataKey="Total Wealth" 
                  stroke="#2563EB" 
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 6, strokeWidth: 0, fill: '#2563EB' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MUTUAL FUND LUMPSUM COMPOUNDER
// ─────────────────────────────────────────────────────────────────────────────
export function MutualFundCalculator() {
  const [principal, setPrincipal] = useState(10000);
  const [rate, setRate] = useState(15);
  const [years, setYears] = useState(10);

  const [invested, setInvested] = useState(0);
  const [returns, setReturns] = useState(0);
  const [maturity, setMaturity] = useState(0);

  useEffect(() => {
    const totalWealth = principal * Math.pow(1 + rate / 100, years);
    const estimatedReturns = Math.max(0, totalWealth - principal);

    setInvested(principal);
    setReturns(estimatedReturns);
    setMaturity(totalWealth);
  }, [principal, rate, years]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-6">
      <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
        <PieChart className="h-5 w-5 text-lime-400" />
        <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Lumpsum Asset growth Projection</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Outlay Principal (₹)</label>
          <input
            type="number"
            value={principal}
            onChange={(e) => setPrincipal(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Annual Profit Yield (% rate)</label>
          <input
            type="number"
            value={rate}
            onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Investment duration (years)</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
        <div className="bg-neutral-950 p-4 border border-neutral-850 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Maturity principal base</span>
          <span className="text-sm font-mono font-bold text-neutral-300">{fmtCurrency(invested)}</span>
        </div>
        <div className="bg-neutral-950 p-4 border border-neutral-850 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Compounded return assets</span>
          <span className="text-sm font-mono font-bold text-lime-400">{fmtCurrency(returns)}</span>
        </div>
        <div className="bg-neutral-950 p-4 border border-neutral-850 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Expected Asset Valuation</span>
          <span className="text-sm font-mono font-bold text-lime-400">{fmtCurrency(maturity)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PROVIDENT FUND (PF/PPF) WEALTH ACCUMULATOR
// ─────────────────────────────────────────────────────────────────────────────
export function ProvidentFundCalculator() {
  const [salary, setSalary] = useState(4000);
  const [contribPct, setContribPct] = useState(12);
  const [rate, setRate] = useState(8.15);
  const [years, setYears] = useState(20);

  const [totalDeposited, setTotalDeposited] = useState(0);
  const [interestMaturity, setInterestMaturity] = useState(0);

  useEffect(() => {
    const monthlyContribution = salary * (contribPct / 100);
    const combinedMonthly = monthlyContribution * 2; // Employee + matching employer contribution
    const monthlyRate = (rate / 100) / 12;

    let balance = 0;
    let totalInvested = 0;

    for (let month = 1; month <= years * 12; month++) {
      balance += combinedMonthly;
      balance += balance * monthlyRate;
      totalInvested += combinedMonthly;
    }

    setTotalDeposited(totalInvested);
    setInterestMaturity(balance);
  }, [salary, contribPct, rate, years]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-6">
      <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
        <Percent className="h-5 w-5 text-lime-400" />
        <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// Provident Fund projection sheet</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Salary Basic (₹)</label>
          <input
            type="number"
            value={salary}
            onChange={(e) => setSalary(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Contribution employee (%)</label>
          <input
            type="number"
            value={contribPct}
            onChange={(e) => setContribPct(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Interest Rate (%)</label>
          <input
            type="number"
            step="0.05"
            value={rate}
            onChange={(e) => setRate(Math.max(0, parseFloat(e.target.value) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
        <div className="space-y-1.5">
          <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider">Hold Tenure (years)</label>
          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Math.max(0, parseInt(e.target.value, 10) || 0))}
            className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-2 text-xs font-mono focus:outline-none focus:border-lime-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
        <div className="bg-neutral-950 p-4 border border-neutral-850 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total Share Capital matches</span>
          <span className="text-sm font-mono font-bold text-neutral-300">{fmtCurrency(totalDeposited)}</span>
        </div>
        <div className="bg-neutral-950 p-4 border border-neutral-850 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Total projected PF wealth balance</span>
          <span className="text-sm font-mono font-bold text-lime-400">{fmtCurrency(interestMaturity)}</span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 50/30/20 BUDGET PLANNER
// ─────────────────────────────────────────────────────────────────────────────
export function BudgetCalc() {
  const [income, setIncome] = useState(5000);

  const needs = income * 0.50;
  const wants = income * 0.30;
  const savings = income * 0.20;

  return (
    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-md space-y-6">
      <div className="border-b border-neutral-800 pb-3 flex items-center gap-2">
        <IndianRupee className="h-5 w-5 text-lime-400" />
        <span className="text-xs font-mono text-lime-400 font-bold uppercase tracking-widest">// 50/30/20 Capital Budgeting System</span>
      </div>

      <div className="space-y-1.5 max-w-sm">
        <label className="block text-xs font-mono text-neutral-400 uppercase tracking-wider font-semibold">Net liquid monthly income revenue pool (₹)</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full bg-neutral-950 border border-neutral-800 text-neutral-200 rounded px-3 py-3 text-sm font-mono font-bold tracking-wider focus:outline-none focus:border-lime-400"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5 pt-2">
        <div className="bg-neutral-950 p-5 border-l-4 border-blue-500 border-neutral-800 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Essential Operating Needs (50%)</span>
          <span className="text-lg font-mono font-bold text-neutral-300">{fmtCurrency(needs)}</span>
          <span className="block text-[10px] text-neutral-500 mt-2 font-sans font-medium uppercase">Rent, Utilities, Food groceries</span>
        </div>

        <div className="bg-neutral-950 p-5 border-l-4 border-purple-500 border-neutral-800 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Wants Discretionary Spend (30%)</span>
          <span className="text-lg font-mono font-bold text-neutral-300">{fmtCurrency(wants)}</span>
          <span className="block text-[10px] text-neutral-500 mt-2 font-sans font-medium uppercase">Dining, Entertainments, luxury shopping</span>
        </div>

        <div className="bg-neutral-950 p-5 border-l-4 border-lime-400 border-neutral-800 rounded">
          <span className="block text-[10px] font-mono text-neutral-500 uppercase tracking-wider mb-1">Savings Portfolio Assets (20%)</span>
          <span className="text-lg font-mono font-bold text-lime-400">{fmtCurrency(savings)}</span>
          <span className="block text-[10px] text-neutral-500 mt-2 font-sans font-medium uppercase">Retirements, stock indices, emergency savings</span>
        </div>
      </div>
    </div>
  );
}
