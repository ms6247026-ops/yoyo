// Slideshow functionality - only run on pages with slideshow
let slideIndex = 1;
let slideInterval;

function plusSlides(n) {
    showSlides(slideIndex += n);
}

function currentSlide(n) {
    showSlides(slideIndex = n);
}

function showSlides(n) {
    let i;
    let slides = document.getElementsByClassName("mySlides");
    
    // Check if slides exist
    if (slides.length === 0) {
        return;
    }
    
    if (n > slides.length) {slideIndex = 1}    
    if (n < 1) {slideIndex = slides.length}
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";  
    }
    slides[slideIndex-1].style.display = "block";  
}

// Initialize slideshow only if slides exist
function initSlideshow() {
    const slides = document.getElementsByClassName("mySlides");
    const slideshowContainer = document.querySelector('.slideshow-container');
    
    if (slides.length > 0 && slideshowContainer) {
        showSlides(slideIndex);
        
        // Auto slideshow
        slideInterval = setInterval(() => {
            plusSlides(1);
        }, 5000);

        // Pause slideshow on hover
        slideshowContainer.addEventListener('mouseenter', () => {
            clearInterval(slideInterval);
        });

        slideshowContainer.addEventListener('mouseleave', () => {
            slideInterval = setInterval(() => {
                plusSlides(1);
            }, 5000);
        });
    }
}

// Initialize slideshow when DOM is loaded
document.addEventListener('DOMContentLoaded', initSlideshow);

// Check and maintain login status across all pages
document.addEventListener('DOMContentLoaded', function() {
    checkLoginStatus();
});

// Function to check and maintain login status
function checkLoginStatus() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (user) {
        // User is logged in - update navigation and show user-specific elements
        updateNavigationForLoggedInUser();
        
        // Check if we're on contact page and initialize booking form
        if (window.location.pathname.includes('contact.html')) {
            initializeBookingForm();
        }
        
        // Check if we're on dashboard page and initialize dashboard
        if (window.location.pathname.includes('dashboard.html')) {
            initializeDashboard();
        }
    } else {
        // User is not logged in - ensure proper navigation
        updateNavigationForLoggedOutUser();
    }
}

// Update navigation for logged in user
function updateNavigationForLoggedInUser() {
    const nav = document.querySelector('nav ul');
    if (nav) {
        // Hide login and register links
        const loginLink = nav.querySelector('a[href="login.html"]');
        const registerLink = nav.querySelector('a[href="register.html"]');
        
        if (loginLink) {
            loginLink.parentElement.style.display = 'none';
        }
        if (registerLink) {
            registerLink.parentElement.style.display = 'none';
        }
        
        // Add logout functionality if not already added
        if (!document.getElementById('logoutNav')) {
            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = '<a href="#" id="logoutNav">Logout</a>';
            nav.appendChild(logoutLi);
            
            // Add logout event listener
            document.getElementById('logoutNav').addEventListener('click', function(e) {
                e.preventDefault();
                logoutUser();
            });
        }
    }
}

// Update navigation for logged out user
function updateNavigationForLoggedOutUser() {
    const nav = document.querySelector('nav ul');
    if (nav) {
        // Show login and register links
        const loginLink = nav.querySelector('a[href="login.html"]');
        const registerLink = nav.querySelector('a[href="register.html"]');
        
        if (loginLink) {
            loginLink.parentElement.style.display = 'block';
        }
        if (registerLink) {
            registerLink.parentElement.style.display = 'block';
        }
        
        // Remove logout link if it exists
        const logoutNav = document.getElementById('logoutNav');
        if (logoutNav) {
            logoutNav.parentElement.remove();
        }
    }
}

// Logout function
function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('bookings');
        
        // Redirect to home page
        window.location.href = 'index.html';
    }
}

// Booking form functionality (for contact.html)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('contact.html')) {
        // Initialize booking form based on login status
        initializeBookingForm();
        
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
            bookingForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Get logged in user (should already be validated by initializeBookingForm)
                const user = JSON.parse(localStorage.getItem('user') || 'null');
                
                // Get form values
                const checkInElement = document.getElementById('bcheckIn');
                const checkOutElement = document.getElementById('bcheckOut');
                const roomTypeElement = document.getElementById('broomType');
                const guestsElement = document.getElementById('bguests');
                const specialRequestsElement = document.getElementById('specialRequests');
                
                if (!checkInElement || !checkOutElement || !roomTypeElement || !guestsElement) {
                    alert('Booking form elements not found. Please refresh the page and try again.');
                    return;
                }
                
                const checkIn = checkInElement.value;
                const checkOut = checkOutElement.value;
                const roomType = roomTypeElement.value;
                const guests = guestsElement.value;
                const specialRequests = specialRequestsElement ? specialRequestsElement.value : '';
                
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Creating Booking...';
                submitBtn.disabled = true;
                
                try {
                    // First, get available rooms
                    const roomsResponse = await fetch('api/rooms.php');
                    const roomsData = await roomsResponse.json();
                    
                    if (!roomsData.success) {
                        throw new Error('Failed to load rooms');
                    }
                    
                    // Find the selected room
                    const selectedRoom = roomsData.data.find(room => room.room_type.toLowerCase() === roomType.toLowerCase());
                    if (!selectedRoom) {
                        throw new Error('Selected room type not available');
                    }
                    
            // Create booking
            const bookingResponse = await fetch('api/booking.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.id}`
                },
                body: JSON.stringify({
                    room_id: selectedRoom.id,
                    check_in_date: checkIn,
                    check_out_date: checkOut,
                    number_of_guests: parseInt(guests),
                    special_requests: specialRequests
                })
            });
                    
                    const bookingData = await bookingResponse.json();
                    
                    if (bookingData.success) {
                        // Update user's booking data in localStorage
                        const currentBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                        currentBookings.unshift(bookingData.data); // Add new booking to the beginning
                        localStorage.setItem('bookings', JSON.stringify(currentBookings));
                        
                        // Show success message with option to view bookings
                        const viewBookings = confirm('Booking successful! Your reservation has been confirmed.\n\nClick OK to view your bookings, or Cancel to stay on this page.');
                        
                        if (viewBookings) {
                            // Redirect to dashboard to view bookings
                            window.location.href = 'dashboard.html';
                        } else {
                            // Reset form and stay on contact page
                            this.reset();
                        }
                    } else {
                        showErrorMessage('Booking failed: ' + bookingData.error);
                    }
                } catch (error) {
                    console.error('Booking error:', error);
                    alert('Booking failed. Please try again later.');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }
});

// Login functionality (for login.html)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('login.html')) {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('loginEmail').value;
                const password = document.getElementById('loginPassword').value;
                
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Signing In...';
                submitBtn.disabled = true;
                
                try {
                    const response = await fetch('api/login.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email,
                            password
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Store user data in localStorage for client-side access
                        localStorage.setItem('user', JSON.stringify(data.data.user));
                        localStorage.setItem('bookings', JSON.stringify(data.data.bookings));
                        
                        alert('Login successful! Redirecting to your account...');
                        window.location.href = 'dashboard.html';
                    } else {
                        alert('Login failed: ' + data.error);
                    }
                } catch (error) {
                    console.error('Login error:', error);
                    alert('Login failed. Please try again later.');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }
});

// User dashboard functionality (for login.html)
if (window.location.pathname.includes('login.html')) {
    // This would normally come from a server after login
    const userData = {
        name: "John Doe",
        email: "john@example.com",
        phone: "+1 234 567 8901",
        bookings: [
            { id: 1, room: "Deluxe Room", date: "2023-11-15 to 2023-11-18", status: "Confirmed" },
            { id: 2, room: "Executive Suite", date: "2023-12-20 to 2023-12-25", status: "Confirmed" }
        ]
    };
    
    function displayUserDashboard() {
        document.getElementById('userDashboard').style.display = 'block';
        document.getElementById('loginForm').style.display = 'none';
        
        document.getElementById('userName').textContent = userData.name;
        document.getElementById('userEmail').textContent = userData.email;
        document.getElementById('userPhone').textContent = userData.phone;
        
        const bookingsList = document.getElementById('bookingsList');
        bookingsList.innerHTML = '';
        
        userData.bookings.forEach(booking => {
            const li = document.createElement('li');
            li.innerHTML = `
                <strong>${booking.room}</strong>
                <span>${booking.date}</span>
                <span class="status ${booking.status.toLowerCase()}">${booking.status}</span>
            `;
            bookingsList.appendChild(li);
        });
    }
    
    // For demo, show dashboard when login button is clicked
    document.getElementById('showDashboard').addEventListener('click', displayUserDashboard);
}

// Register functionality (for register.html)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('register.html')) {
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                // Get form values
                const firstName = document.getElementById('firstName').value;
                const lastName = document.getElementById('lastName').value;
                const email = document.getElementById('email').value;
                const phone = document.getElementById('phone').value;
                const password = document.getElementById('password').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                const dateOfBirth = document.getElementById('dateOfBirth').value;
                const country = document.getElementById('country').value;
                const terms = document.getElementById('terms').checked;
                
                // Validate form
                if (!validateRegisterForm(firstName, lastName, email, phone, password, confirmPassword, dateOfBirth, country, terms)) {
                    return;
                }
                
                // Show loading state
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Creating Account...';
                submitBtn.disabled = true;
                
                try {
                    const response = await fetch('api/register.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            firstName,
                            lastName,
                            email,
                            phone,
                            password,
                            confirmPassword,
                            dateOfBirth,
                            country,
                            newsletter: false
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Show success message
                        showSuccessMessage('Registration successful! Welcome to Next Inn. You can now log in with your credentials.');
                        
                        // Clear the form
                        this.reset();
                        
                        // Redirect to login page after a short delay
                        setTimeout(() => {
                            window.location.href = 'login.html';
                        }, 2000);
                    } else {
                        showErrorMessage('Registration failed: ' + data.error);
                    }
                } catch (error) {
                    console.error('Registration error:', error);
                    showErrorMessage('Registration failed. Please try again later.');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
            
            // Password confirmation validation
            const confirmPasswordField = document.getElementById('confirmPassword');
            if (confirmPasswordField) {
                confirmPasswordField.addEventListener('input', function() {
                    const password = document.getElementById('password').value;
                    const confirmPassword = this.value;
                    
                    if (password !== confirmPassword) {
                        this.setCustomValidity('Passwords do not match');
                    } else {
                        this.setCustomValidity('');
                    }
                });
            }
            
            // Password strength validation
            const passwordField = document.getElementById('password');
            if (passwordField) {
                passwordField.addEventListener('input', function() {
                    const password = this.value;
                    const confirmPassword = document.getElementById('confirmPassword').value;
                    
                    // Check password strength
                    if (password.length < 8) {
                        this.setCustomValidity('Password must be at least 8 characters long');
                    } else {
                        this.setCustomValidity('');
                    }
                    
                    // Update confirm password validation
                    if (confirmPassword && password !== confirmPassword) {
                        document.getElementById('confirmPassword').setCustomValidity('Passwords do not match');
                    } else if (confirmPassword) {
                        document.getElementById('confirmPassword').setCustomValidity('');
                    }
                });
            }
            
            // Email validation
            const emailField = document.getElementById('email');
            if (emailField) {
                emailField.addEventListener('input', function() {
                    const email = this.value;
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    
                    if (email && !emailRegex.test(email)) {
                        this.setCustomValidity('Please enter a valid email address');
                    } else {
                        this.setCustomValidity('');
                    }
                });
            }
            
            // Phone validation
            const phoneField = document.getElementById('phone');
            if (phoneField) {
                phoneField.addEventListener('input', function() {
                    const phone = this.value;
                    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
                    
                    if (phone && !phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
                        this.setCustomValidity('Please enter a valid phone number');
                    } else {
                        this.setCustomValidity('');
                    }
                });
            }
            
            // Terms and conditions validation
            const termsField = document.getElementById('terms');
            if (termsField) {
                termsField.addEventListener('change', function() {
                    if (!this.checked) {
                        this.setCustomValidity('You must agree to the terms and conditions');
                    } else {
                        this.setCustomValidity('');
                    }
                });
            }
            
            // Initialize DOB selector
            initializeDOBSelector();
        }
    }
});

// Initialize DOB selector functionality
function initializeDOBSelector() {
    const daySelect = document.getElementById('dobDay');
    const monthSelect = document.getElementById('dobMonth');
    const yearSelect = document.getElementById('dobYear');
    const hiddenDateInput = document.getElementById('dateOfBirth');
    
    if (!daySelect || !monthSelect || !yearSelect || !hiddenDateInput) {
        return;
    }
    
    // Populate year dropdown (from 1950 to current year - 18)
    const currentYear = new Date().getFullYear();
    const minYear = currentYear - 100; // Allow up to 100 years old
    const maxYear = currentYear - 18; // Must be at least 18
    
    for (let year = maxYear; year >= minYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
    
    // Initially populate days with all 31 days
    populateDays();
    
    // Populate day dropdown
    function populateDays() {
        // Remember the currently selected day
        const currentSelectedDay = daySelect.value;
        
        // Clear existing options except the first one
        daySelect.innerHTML = '<option value="">Day</option>';
        
        const selectedMonth = monthSelect.value;
        const selectedYear = yearSelect.value;
        
        // If no month or year selected, show all 31 days
        if (!selectedMonth || !selectedYear) {
            for (let day = 1; day <= 31; day++) {
                const option = document.createElement('option');
                option.value = day.toString().padStart(2, '0');
                option.textContent = day;
                daySelect.appendChild(option);
            }
            
            // Restore the previously selected day if it exists
            if (currentSelectedDay && currentSelectedDay <= 31) {
                daySelect.value = currentSelectedDay;
            }
            return;
        }
        
        // Get number of days in the selected month/year
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        
        for (let day = 1; day <= daysInMonth; day++) {
            const option = document.createElement('option');
            option.value = day.toString().padStart(2, '0');
            option.textContent = day;
            daySelect.appendChild(option);
        }
        
        // Restore the previously selected day if it's valid for the new month
        if (currentSelectedDay && parseInt(currentSelectedDay) <= daysInMonth) {
            daySelect.value = currentSelectedDay;
        }
    }
    
    // Update hidden date input when any dropdown changes
    function updateHiddenDate() {
        const day = daySelect.value;
        const month = monthSelect.value;
        const year = yearSelect.value;
        
        if (day && month && year) {
            const dateString = `${year}-${month}-${day}`;
            hiddenDateInput.value = dateString;
            
            // Validate age
            validateAge(dateString);
        } else {
            hiddenDateInput.value = '';
        }
    }
    
    // Validate age function
    function validateAge(dateString) {
        const today = new Date();
        const birthDate = new Date(dateString);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Update hint text with age
        const hint = document.querySelector('.dob-hint');
        if (hint) {
            if (age < 18) {
                hint.textContent = `You are ${age} years old. You must be at least 18 years old to register.`;
                hint.style.color = '#dc3545';
            } else {
                hint.textContent = `You are ${age} years old. Age requirement satisfied.`;
                hint.style.color = '#28a745';
            }
        }
    }
    
    // Event listeners
    monthSelect.addEventListener('change', function() {
        populateDays();
        updateHiddenDate();
    });
    
    yearSelect.addEventListener('change', function() {
        populateDays();
        updateHiddenDate();
    });
    
    daySelect.addEventListener('change', updateHiddenDate);
}

// Initialize booking form based on user login status
function initializeBookingForm() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const userInfoDisplay = document.getElementById('userInfoDisplay');
    const loginRequired = document.getElementById('loginRequired');
    const bookingForm = document.getElementById('bookingForm');
    
    if (user) {
        // User is logged in - show user info and booking form
        if (userInfoDisplay) {
            document.getElementById('displayName').textContent = `${user.first_name} ${user.last_name}`;
            document.getElementById('displayEmail').textContent = user.email;
            document.getElementById('displayPhone').textContent = user.phone;
            userInfoDisplay.style.display = 'block';
        }
        
        if (loginRequired) {
            loginRequired.style.display = 'none';
        }
        
        if (bookingForm) {
            bookingForm.style.display = 'block';
        }
    } else {
        // User is not logged in - show login prompt
        if (userInfoDisplay) {
            userInfoDisplay.style.display = 'none';
        }
        
        if (loginRequired) {
            loginRequired.style.display = 'block';
        }
        
        if (bookingForm) {
            bookingForm.style.display = 'none';
        }
    }
}

// Initialize dashboard for logged-in users
function initializeDashboard() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (user) {
        // Populate user information
        document.getElementById('userName').textContent = `${user.first_name} ${user.last_name}`;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userPhone').textContent = user.phone;
        document.getElementById('userCountry').textContent = user.country;
        
        // Load bookings
        loadUserBookings();
    } else {
        // Redirect to login if not logged in
        window.location.href = 'login.html';
    }
}

// Load user bookings for dashboard
async function loadUserBookings() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    
    try {
        const response = await fetch('api/booking.php', {
            headers: {
                'Authorization': `Bearer ${user.id}`
            }
        });
        
        const data = await response.json();
        const bookingsContainer = document.getElementById('bookingsContainer');
        
        if (data.success && data.data.length > 0) {
            bookingsContainer.innerHTML = '';
            data.data.forEach(booking => {
                const bookingCard = createBookingCard(booking);
                bookingsContainer.appendChild(bookingCard);
            });
        } else {
            bookingsContainer.innerHTML = '<div class="no-bookings">No bookings found. <a href="contact.html">Make your first booking!</a></div>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsContainer').innerHTML = '<div class="error">Failed to load bookings. Please try again later.</div>';
    }
}

// Create booking card for dashboard
function createBookingCard(booking) {
    const card = document.createElement('div');
    card.className = 'booking-card';
    
    const checkInDate = new Date(booking.check_in_date);
    const checkOutDate = new Date(booking.check_out_date);
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    
    card.innerHTML = `
        <div class="booking-header">
            <h4>${booking.room_name}</h4>
            <span class="status ${booking.booking_status}">${booking.booking_status}</span>
        </div>
        <div class="booking-details">
            <div class="detail-item">
                <i class="fas fa-calendar-alt"></i>
                <span>${checkInDate.toLocaleDateString()} - ${checkOutDate.toLocaleDateString()}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-moon"></i>
                <span>${nights} night${nights > 1 ? 's' : ''}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-users"></i>
                <span>${booking.number_of_guests} guest${booking.number_of_guests > 1 ? 's' : ''}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-bed"></i>
                <span>${booking.room_type} - Floor ${booking.floor_number}</span>
            </div>
            <div class="detail-item">
                <i class="fas fa-dollar-sign"></i>
                <span>$${booking.total_amount}</span>
            </div>
        </div>
        ${booking.special_requests ? `<div class="special-requests"><strong>Special Requests:</strong> ${booking.special_requests}</div>` : ''}
        <div class="booking-actions">
            ${booking.booking_status === 'pending' || booking.booking_status === 'confirmed' ? 
                `<button class="btn cancel-btn" onclick="cancelBooking(${booking.id})">Cancel Booking</button>` : 
                ''}
        </div>
    `;
    
    return card;
}

// Cancel booking function
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!user) return;
    
    try {
        const response = await fetch('api/booking.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.id}`
            },
            body: JSON.stringify({
                booking_id: bookingId,
                action: 'cancel'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccessMessage('Booking cancelled successfully!');
            loadUserBookings(); // Reload bookings
        } else {
            showErrorMessage('Failed to cancel booking: ' + data.error);
        }
    } catch (error) {
        console.error('Cancel booking error:', error);
        showErrorMessage('Failed to cancel booking. Please try again later.');
    }
}

// Register form validation function
function validateRegisterForm(firstName, lastName, email, phone, password, confirmPassword, dateOfBirth, country, terms) {
    let isValid = true;
    
    // Check required fields
    if (!firstName.trim()) {
        alert('Please enter your first name');
        isValid = false;
    }
    
    if (!lastName.trim()) {
        alert('Please enter your last name');
        isValid = false;
    }
    
    if (!email.trim()) {
        alert('Please enter your email address');
        isValid = false;
    }
    
    if (!phone.trim()) {
        alert('Please enter your phone number');
        isValid = false;
    }
    
    if (!password) {
        alert('Please enter a password');
        isValid = false;
    }
    
    if (!confirmPassword) {
        alert('Please confirm your password');
        isValid = false;
    }
    
    if (!dateOfBirth) {
        alert('Please select your date of birth');
        isValid = false;
    }
    
    if (!country) {
        alert('Please select your country');
        isValid = false;
    }
    
    if (!terms) {
        alert('You must agree to the terms and conditions');
        isValid = false;
    }
    
    // Check password match
    if (password !== confirmPassword) {
        alert('Passwords do not match');
        isValid = false;
    }
    
    // Check password length
    if (password.length < 8) {
        alert('Password must be at least 8 characters long');
        isValid = false;
    }
    
    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert('Please enter a valid email address');
        isValid = false;
    }
    
    // Check phone format
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
        alert('Please enter a valid phone number');
        isValid = false;
    }
    
    // Check age (must be at least 18)
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    
    if (age < 18) {
        alert('You must be at least 18 years old to register');
        isValid = false;
    }
    
    return isValid;
}

// Message display functions
function showSuccessMessage(message) {
    // Remove any existing messages
    removeExistingMessages();
    
    // Create success message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message success-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Show with animation
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        removeMessage(messageDiv);
    }, 5000);
}

function showErrorMessage(message) {
    // Remove any existing messages
    removeExistingMessages();
    
    // Create error message element
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message error-message';
    messageDiv.innerHTML = `
        <div class="message-content">
            <i class="fas fa-exclamation-circle"></i>
            <span>${message}</span>
            <button class="close-message" onclick="removeMessage(this.parentElement.parentElement)">×</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(messageDiv);
    
    // Show with animation
    setTimeout(() => {
        messageDiv.classList.add('show');
    }, 100);
}

function removeExistingMessages() {
    const existingMessages = document.querySelectorAll('.message');
    existingMessages.forEach(message => removeMessage(message));
}

function removeMessage(messageElement) {
    if (messageElement && messageElement.parentNode) {
        messageElement.classList.remove('show');
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        }, 300);
    }
}