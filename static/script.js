const chinesetext = document.getElementById("chinesetext");
const submit = document.getElementById("submit");
const annotated = document.getElementById("annotated");

function displayWithRuby(char, jyut) {
  if (char === '\n') {
    return '<br>';
  }
  if (jyut) {
    return `<ruby class="clickable">${char}<rt>${jyut}</rt></ruby>`;
  } else
    return char;
}


submit.addEventListener("click", async () => {
  const query = encodeURIComponent(chinesetext.value);  // preserve line breaks
  const response = await fetch("/jyutping?chinese=" + query);
  const data = await response.json();
  const rubies = data.map((data) => displayWithRuby(...data));

  annotated.innerHTML = rubies.join("");
});

annotated.addEventListener("click", (e) => {
  const ruby = e.target.closest("ruby.clickable");
  if (ruby) {
    const rt = ruby.querySelector("rt");
    if (rt) {
      rt.classList.toggle("visible");
    }
  }
});

document.getElementById("showAll").addEventListener("click", (e) => {
  const rubies = document.querySelectorAll("rt");
  Array(...rubies).forEach((rt) => {rt.classList.add("visible")})
})

document.getElementById("hideAll").addEventListener("click", (e) => {
  const rubies = document.querySelectorAll("rt");
  Array(...rubies).forEach((rt) => {rt.classList.remove("visible")})
})
