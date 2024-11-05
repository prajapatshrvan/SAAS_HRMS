$(document).ready(function () {
  $(".sideMenuToggler").click(function () {
    $(".sideMenu").toggleClass("active");
    $(".text").toggleClass("text-active");
    $(".icon").toggleClass("icon-active");
    $(".nav-link").toggleClass("nav-link-active");
    $(".main").toggleClass("main-active");
    $(".dropdown").toggleClass("dropdown-active");
    $(".submenu_icon").toggle();
  });
  $(".smm").click(function () {
    $(".sideMenu").toggleClass("smm-active");
    $(".main").toggleClass("main-active");
  });
  // $("#home").click(function () {
  //   $("#home_expand").text() == 'expand_less' ? $("#home_expand").text('expand_more') : $("#home_expand").text('expand_less');
  //   $('#home_submenu').slideToggle();
  // });
  $(".sideMenu-li").each(function (index) {
    $(this).hover(
      function () {
        $(this).find(".submenu_circle").css("background-color", "transparent");
      },
      function () {
        $(this).find(".submenu_circle").css("background-color", "#F80");
      }
    );
  });
});

function activeSideBar(name) {
  $("#" + name).addClass("sideMenu-li-active");
}

function logout() {
  if (confirm("Do you really want to logout")) {
    // DO POST
    $.ajax({
      type: "POST",
      contentType: "application/json",
      url: "/admin/logout",
    }).done((res) => {
      if (res == "success") {
        window.location.href = "/admin/login";
      } else {
        alert(res);
      }
    });
  }
}

function dropdown(div) {
  var home = div.find("#home_expand");
  var content = div.find("#dropdown-content");
  home.text() == "expand_less"
    ? home.text("expand_more")
    : home.text("expand_less");

  content.slideToggle();
}

window.addEventListener("load", function () {
  var preloader = document.querySelector(".preloader");
  var content = document.querySelector(".content");

  // Hide preloader
  preloader.style.display = "none";

  // Show content
  content.style.display = "block";
});

var currentPageUrl = window.location.href;

var menuLinks = document.querySelectorAll(".sidebar ul li a");

menuLinks.forEach(function (link) {
  if (link.href === currentPageUrl) {
    link.classList.add("active");
  }
});
