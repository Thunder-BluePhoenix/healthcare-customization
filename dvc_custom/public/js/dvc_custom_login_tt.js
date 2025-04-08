frappe.ready(function() {
  // Check for different login page URL patterns
  const isLoginPage = 
    window.location.pathname.includes("/login") || 
    window.location.hash === "#login" || 
    (window.location.pathname === "/" && window.location.hash === "#login") ||
    document.body.classList.contains('page-login') ||
    document.body.getAttribute('data-route') === 'login' ||
    (document.body.getAttribute('data-route') === '' && window.location.hash.includes('login'));
  
  if (isLoginPage) {
    console.log("Login page detected, applying custom styling");
    
    // Apply background to body with !important to ensure it doesn't get overridden
    document.body.setAttribute('style', 
      'background-image: url("/assets/dvc_custom/images/login-bg.jpg") !important; ' +
      'background-size: cover !important; ' +
      'background-position: center center !important; ' +
      'background-repeat: no-repeat !important; ' +
      'background-attachment: fixed !important;'
    );
    
    // Also add a class to ensure CSS selectors work
    document.body.classList.add('custom-login-page');
    
    // Make the login card semi-transparent
    const loginCards = document.querySelectorAll('.page-card');
    loginCards.forEach(card => {
      // Add semi-transparent background
      card.style.background = "rgba(255, 255, 255, 0.8)";
      
      // No additional margin needed for the login card
    });
    
    // Optional: Enhance contrast for better visibility
    const cardHeads = document.querySelectorAll('.page-card-head');
    cardHeads.forEach(head => {
      head.style.borderBottom = "1px solid rgba(125, 125, 125, 0.3)";
    });
    
    const headings = document.querySelectorAll('.page-card-head h4');
    headings.forEach(heading => {
      heading.style.color = "#444";
    });
    
    const inputs = document.querySelectorAll('.page-card input.form-control');
    inputs.forEach(input => {
      input.style.backgroundColor = "rgba(255, 255, 255, 0.9)";
      input.style.border = "1px solid rgba(0, 0, 0, 0.2)";
    });
    
    // Hide all navbar elements except the Home button
    const navbarItems = document.querySelectorAll('.navbar .navbar-nav li');
    navbarItems.forEach(item => {
      // Check if this is not the Home button
      if (!item.textContent.includes('Home')) {
        item.style.display = 'none';
      }
    });
    
    // Also hide any other navbar elements like dropdown menus
    const navbarExtras = document.querySelectorAll('.navbar .dropdown, .navbar .navbar-right, .navbar form');
    navbarExtras.forEach(element => {
      element.style.display = 'none';
    });
    
    // Force the navbar to be simple and minimal
    const navbar = document.querySelector('.navbar');
    if (navbar) {
      navbar.style.boxShadow = 'none';
      navbar.style.backgroundColor = 'transparent';
      navbar.style.borderBottom = 'none';
    }
    
    // Make home link more visible
    const homeLink = document.querySelector('.navbar .navbar-nav li:first-child a');
    if (homeLink) {
      homeLink.style.color = '#fff';
      homeLink.style.fontWeight = 'bold';
      homeLink.style.textShadow = '0px 0px 3px rgba(0,0,0,0.5)';
    }
  }
});

