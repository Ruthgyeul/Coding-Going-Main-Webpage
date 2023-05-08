window.onload = function() {
  function changeImage() {
    var BackgroundImg = [
      "Assets/backgrounds/team01.jpg",
      "Assets/backgrounds/team02.jpg",
      "Assets/backgrounds/team03.jpg",
      "Assets/backgrounds/team04.jpg"
    ];
    var i = Math.floor(Math.random() * 4);
    document.getElementById("home").style.backgroundImage =
      'url("' + BackgroundImg[i] + '")';
  }
  window.setInterval(changeImage, 3000);
};
