export const canvas = document.getElementById("canvas");
export const ctx = canvas.getContext("2d");
export const allToolInputs = document.querySelectorAll("input[type='radio']");
export const allColors = document.querySelectorAll(".color");
export const allOpacity = document.querySelectorAll(".opacity-btn");
export const strokeSlider = document.getElementById("stroke");
export const clearBtn = document.getElementById("clear-tool");

// CANVAS
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// STATE
export let currentCanvasState = "IDLE";
export let currentTool = "NONE";
export let currentToolCategory = "NONE";
export let selectedElements = [];
export let resizingKey = "REVERT";
export let movement = new Map();
export let currentColor = "#0C8EF4";
export let currentWidth = 15;
export let currentOpacity = 0.6;