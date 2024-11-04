const container = document.querySelector(".container");
const logo = document.querySelector(".logo");
const subtitle = document.querySelectorAll(".subtitle");
const heroImg = document.querySelector(".hero_img");
const startBtn = document.querySelector(".btn-wrap");
window.addEventListener("load", () => {
  logo.classList.add("active");
  subtitle.forEach(el => el.classList.add("active"));
  heroImg.classList.add("active");
  startBtn.classList.add("active");
});

startBtn.addEventListener("click", () => {
  container.classList.add("fade");

  setTimeout(() => {
    window.location.href = "./html/main.html"
  }, 500);
});