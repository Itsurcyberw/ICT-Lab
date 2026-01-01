
document.addEventListener('DOMContentLoaded', function() {
    
    const button = document.getElementById('changeBtn');
    
    
    button.addEventListener('click', function() {
       
        alert('Button clicked! Welcome to Ibrahim\'s page');
        
       
        const heading = document.querySelector('h1');
        heading.textContent = 'Ibrahim - Security Enthusiast';
    });
});