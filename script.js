// Slideshow functionality - only run on pages with slideshow
let slideIndex = 1;
let slideInterval;

function plusSlides(n) {
    showSlides(slideIndex += n);
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
    initializeBookNowButtons();
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
            // Dashboard has its own initialization script, but we still update navigation
            // The dashboard.html script will handle the dashboard initialization
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
        
        // Admin link removed - admin login is now integrated with regular login
        // Remove any existing admin links from navbar (except on admin.html page itself)
        const existingAdminLink = document.getElementById('adminNav');
        if (existingAdminLink) {
            existingAdminLink.parentElement.remove();
        }
        // Remove all admin.html links from navbar (except on admin page)
        if (!window.location.pathname.includes('admin.html')) {
            const adminLinks = nav.querySelectorAll('a[href="admin.html"]');
            adminLinks.forEach(link => {
                link.parentElement.remove();
            });
        }
        
        // Add dashboard link if not already added
        if (!document.getElementById('dashboardNav')) {
            const dashboardLi = document.createElement('li');
            dashboardLi.innerHTML = '<a href="dashboard.html" id="dashboardNav"><i class="fas fa-user-circle"></i> My Account</a>';
            nav.appendChild(dashboardLi);
        }
        
        // Add logout functionality if not already added
        if (!document.getElementById('logoutNav')) {
            const logoutLi = document.createElement('li');
            logoutLi.innerHTML = '<a href="#" id="logoutNav"><i class="fas fa-sign-out-alt"></i> Logout</a>';
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
        
        // Remove dashboard link if it exists
        const dashboardNav = document.getElementById('dashboardNav');
        if (dashboardNav) {
            dashboardNav.parentElement.remove();
        }
        
        // Remove logout link if it exists
        const logoutNav = document.getElementById('logoutNav');
        if (logoutNav) {
            logoutNav.parentElement.remove();
        }
    }
}

// Logout function
async function logoutUser() {
    if (confirm('Are you sure you want to logout?')) {
        try {
            // Call logout API
            await fetch('api/logout.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } catch (error) {
            console.error('Logout API error:', error);
        }
        
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('bookings');
        localStorage.removeItem('adminLoggedIn');
        
        // Redirect to home page
        window.location.href = 'index.html';
    }
}

// Booking form functionality (for contact.html and booking.html)
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('contact.html') || window.location.pathname.includes('booking.html')) {
        // Initialize booking form based on login status
        initializeBookingForm();
        
        // Pre-fill room type from URL parameter (for booking.html)
        if (window.location.pathname.includes('booking.html')) {
            const urlParams = new URLSearchParams(window.location.search);
            const roomType = urlParams.get('room');
            if (roomType) {
                const roomTypeSelect = document.getElementById('broomType');
                if (roomTypeSelect) {
                    // Map room type keys to display names
                    const roomTypeMap = {
                        'deluxe': 'Deluxe Room',
                        'executive': 'Executive Suite',
                        'presidential': 'Presidential Suite',
                        'family': 'Family Room',
                        'ultra': 'Ultra Luxury Room'
                    };
                    const mappedRoomType = roomTypeMap[roomType.toLowerCase()] || roomType;
                    roomTypeSelect.value = mappedRoomType;
                }
            }
        }
        
        const bookingForm = document.getElementById('bookingFormElement') || document.getElementById('bookingForm');
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
                    
                    // Map form room type to database room type
                    const roomTypeMapping = {
                        'deluxe room': 'Deluxe',
                        'executive suite': 'Suite',
                        'presidential suite': 'Presidential',
                        'family room': 'Family',
                        'ultra luxury room': 'Penthouse'
                    };
                    
                    const dbRoomType = roomTypeMapping[roomType.toLowerCase()] || roomType;
                    
                    // Find the selected room - try both mapped type and original type
                    let selectedRoom = roomsData.data.find(room => 
                        room.room_type.toLowerCase() === dbRoomType.toLowerCase() ||
                        room.room_type.toLowerCase() === roomType.toLowerCase()
                    );
                    
                    // If still not found, try matching by room_name
                    if (!selectedRoom) {
                        selectedRoom = roomsData.data.find(room => 
                            room.room_name.toLowerCase().includes(roomType.toLowerCase()) ||
                            roomType.toLowerCase().includes(room.room_name.toLowerCase())
                        );
                    }
                    
                    if (!selectedRoom) {
                        console.error('Available rooms:', roomsData.data);
                        console.error('Looking for room type:', roomType, 'or', dbRoomType);
                        const availableTypes = roomsData.data.map(r => `${r.room_name} (${r.room_type})`).join(', ');
                        throw new Error(`Selected room type "${roomType}" not available. Available rooms: ${availableTypes}`);
                    }
                    
                    // Calculate number of nights
                    const checkInDate = new Date(checkIn);
                    const checkOutDate = new Date(checkOut);
                    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
                    const totalAmount = parseFloat(selectedRoom.price_per_night) * nights;
                    
                    // Create booking first (with pending status)
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
                    
                    if (!bookingData.success) {
                        throw new Error(bookingData.error || 'Failed to create booking');
                    }
                    
                    const bookingId = bookingData.data.id;
                    
                    // Create Razorpay order
                    const paymentResponse = await fetch('api/payment.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${user.id}`
                        },
                        body: JSON.stringify({
                            action: 'create_order',
                            amount: totalAmount,
                            booking_id: bookingId
                        })
                    });
                    
                    const paymentData = await paymentResponse.json();
                    
                    if (!paymentData.success) {
                        throw new Error(paymentData.error || 'Failed to create payment order');
                    }
                    
                    // Check if Razorpay is loaded
                    if (typeof Razorpay === 'undefined') {
                        throw new Error('Razorpay payment gateway is not loaded. Please refresh the page.');
                    }
                    
                    // Initialize Razorpay checkout
                    const options = {
                        key: paymentData.data.key_id,
                        amount: Math.round(paymentData.data.amount * 100), // Convert to paise
                        currency: paymentData.data.currency,
                        order_id: paymentData.data.order_id,
                        name: 'Next Inn',
                        description: `Booking for ${selectedRoom.room_name} - ${nights} night(s)`,
                        prefill: {
                            name: `${user.first_name} ${user.last_name}`,
                            email: user.email,
                            contact: user.phone
                        },
                        theme: {
                            color: '#3498db'
                        },
                        handler: async function(response) {
                            // Payment successful - verify payment
                            try {
                                const verifyResponse = await fetch('api/payment.php', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${user.id}`
                                    },
                                    body: JSON.stringify({
                                        action: 'verify_payment',
                                        razorpay_order_id: response.razorpay_order_id,
                                        razorpay_payment_id: response.razorpay_payment_id,
                                        razorpay_signature: response.razorpay_signature,
                                        booking_id: bookingId
                                    })
                                });
                                
                                const verifyData = await verifyResponse.json();
                                
                                if (verifyData.success) {
                        // Update user's booking data in localStorage
                        const currentBookings = JSON.parse(localStorage.getItem('bookings') || '[]');
                                    // Reload bookings to get updated status
                                    const updatedBookingsResponse = await fetch('api/booking.php', {
                                        headers: {
                                            'Authorization': `Bearer ${user.id}`
                                        }
                                    });
                                    const updatedBookings = await updatedBookingsResponse.json();
                                    if (updatedBookings.success) {
                                        localStorage.setItem('bookings', JSON.stringify(updatedBookings.data));
                                    }
                                    
                                    // Show success message
                                    showSuccessMessage('Payment successful! Your booking has been confirmed.');
                                    
                                    setTimeout(() => {
                                        const viewBookings = confirm('Booking confirmed! Click OK to view your bookings.');
                        if (viewBookings) {
                            window.location.href = 'dashboard.html';
                        } else {
                            this.reset();
                        }
                                    }, 1000);
                    } else {
                                    throw new Error(verifyData.error || 'Payment verification failed');
                                }
                            } catch (error) {
                                console.error('Payment verification error:', error);
                                console.error('Error details:', error.message);
                                showErrorMessage('Payment successful but verification failed: ' + (error.message || 'Unknown error') + '. Please contact support with your payment ID.');
                            }
                        },
                        modal: {
                            ondismiss: function() {
                                // User closed the payment modal
                                showErrorMessage('Payment cancelled. Your booking is pending payment.');
                            }
                        }
                    };
                    
                    const razorpay = new Razorpay(options);
                    razorpay.open();
                    
                    // Update button text back
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                } catch (error) {
                    console.error('Booking error:', error);
                    showErrorMessage(error.message || 'Booking failed. Please try again later.');
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
                        
                        // Check role and redirect accordingly
                        const role = data.data.role || 'user';
                        
                        if (role === 'admin') {
                            // Store admin login status
                            localStorage.setItem('adminLoggedIn', 'true');
                            alert('Admin login successful! Redirecting to admin dashboard...');
                            window.location.href = 'admin.html';
                        } else {
                            // Regular user login
                            if (data.data.bookings) {
                                localStorage.setItem('bookings', JSON.stringify(data.data.bookings));
                            }
                            
                            // Check if there's a return URL parameter
                            const urlParams = new URLSearchParams(window.location.search);
                            const returnUrl = urlParams.get('return');
                            
                            if (returnUrl) {
                                // Redirect to the return URL (e.g., booking.html)
                                window.location.href = decodeURIComponent(returnUrl);
                            } else {
                                alert('Login successful! Redirecting to your account...');
                                window.location.href = 'dashboard.html';
                            }
                        }
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
    const bookingForm = document.getElementById('bookingForm') || document.querySelector('.booking-form-container');
    
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
    
    if (!user) {
        // Redirect to login if not logged in
        alert('Please login to access your account');
        window.location.href = 'login.html';
        return;
    }
    
    try {
        // Populate user information
        const userNameEl = document.getElementById('userName');
        const userFirstNameEl = document.getElementById('userFirstName');
        const userEmailEl = document.getElementById('userEmail');
        const userPhoneEl = document.getElementById('userPhone');
        const userCountryEl = document.getElementById('userCountry');
        
        if (userNameEl) {
            userNameEl.textContent = `${user.first_name} ${user.last_name}`;
        }
        if (userFirstNameEl) {
            userFirstNameEl.textContent = user.first_name;
        }
        if (userEmailEl) {
            userEmailEl.textContent = user.email;
        }
        if (userPhoneEl) {
            userPhoneEl.textContent = user.phone || 'N/A';
        }
        if (userCountryEl) {
            userCountryEl.textContent = user.country || 'N/A';
        }
        
        // Load bookings
        loadUserBookings();
    } catch (error) {
        console.error('Dashboard initialization error:', error);
        alert('Error loading dashboard. Please refresh the page.');
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
                <i class="fas fa-coins"></i>
                <span>₹${booking.total_amount}</span>
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

// Room Data
const roomData = {
    deluxe: {
        name: 'Deluxe Room',
        floor: '1st Floor',
        description: 'Spacious, modern, and perfect for solo travelers. Contains 4 bedrooms with attached washroom and balcony, living area, kitchen with cutlery, and TV.',
        price: '₹2,999',
        images: [
            'images/deluxe-room.jpg',
            'images/beach.jpg',
            'images/pool.jpg',
            'images/dining.jpg'
        ],
        amenities: [
            { icon: 'fas fa-wifi', text: 'Free Wi-Fi' },
            { icon: 'fas fa-tv', text: 'Smart TV' },
            { icon: 'fas fa-utensils', text: 'Kitchenette' },
            { icon: 'fas fa-swimming-pool', text: 'Pool Access' }
        ]
    },
    executive: {
        name: 'Executive Suite',
        floor: '2nd Floor',
        description: 'Extra comfort with a separate living area and kitchen and 3 bedrooms.',
        price: '₹3,999',
        images: [
            'images/executive-suite.jpg',
            'images/beach.jpg',
            'images/pool.jpg',
            'images/fitness.jpg'
        ],
        amenities: [
            { icon: 'fas fa-wifi', text: 'Free Wi-Fi' },
            { icon: 'fas fa-tv', text: 'Smart TV' },
            { icon: 'fas fa-utensils', text: 'Full Kitchen' },
            { icon: 'fas fa-swimming-pool', text: 'Pool Access' },
            { icon: 'fas fa-concierge-bell', text: 'Concierge Service' }
        ]
    },
    presidential: {
        name: 'Presidential Suite',
        floor: '3rd Floor',
        description: 'Ultimate luxury with premium amenities, private swimming pool, 2 bedrooms and cozy vibe balcony.',
        price: '₹4,499',
        images: [
            'images/presidential-suite.jpg',
            'images/penthouse1.jpg',
            'images/penthouse2.jpg',
            'images/penthouse3.jpg'
        ],
        amenities: [
            { icon: 'fas fa-wifi', text: 'Free Wi-Fi' },
            { icon: 'fas fa-tv', text: 'Smart TV' },
            { icon: 'fas fa-swimming-pool', text: 'Private Pool' },
            { icon: 'fas fa-spa', text: 'Spa Access' },
            { icon: 'fas fa-concierge-bell', text: '24/7 Butler' }
        ]
    },
    family: {
        name: 'Family Room',
        floor: '4th Floor',
        description: 'Designed for groups with added convenience and family. 2 bedrooms and 1 family room.',
        price: '₹4,999',
        images: [
            'images/family-room.jpg',
            'images/beach.jpg',
            'images/pool.jpg',
            'images/dining.jpg'
        ],
        amenities: [
            { icon: 'fas fa-wifi', text: 'Free Wi-Fi' },
            { icon: 'fas fa-tv', text: 'Smart TV' },
            { icon: 'fas fa-utensils', text: 'Kitchenette' },
            { icon: 'fas fa-swimming-pool', text: 'Pool Access' },
            { icon: 'fas fa-child', text: 'Kids Activities' }
        ]
    },
    ultra: {
        name: 'Ultra Luxury Room',
        floor: '5th Floor',
        description: 'Designed for couples or family. 3 rooms with washroom and balcony.',
        price: '₹5,999',
        images: [
            'images/ultra-luxury.jpg',
            'images/penthouse1.jpg',
            'images/penthouse2.jpg',
            'images/penthouse3.jpg'
        ],
        amenities: [
            { icon: 'fas fa-wifi', text: 'Free Wi-Fi' },
            { icon: 'fas fa-tv', text: 'Smart TV' },
            { icon: 'fas fa-wine-glass-alt', text: 'Mini Bar' },
            { icon: 'fas fa-swimming-pool', text: 'Rooftop Pool' },
            { icon: 'fas fa-spa', text: 'Spa Access' }
        ]
    }
};

// Current modal state
let currentRoomImages = [];
let currentImageIndex = 0;

// Open room modal
function openRoomModal(roomType) {
    const room = roomData[roomType];
    if (!room) return;

    const modal = document.getElementById('roomModal');
    currentRoomImages = room.images;
    currentImageIndex = 0;

    // Set main image
    document.getElementById('modalMainImage').src = room.images[0];
    document.getElementById('modalRoomName').textContent = room.name;
    document.getElementById('modalFloor').textContent = room.floor;
    document.getElementById('modalDescription').textContent = room.description;
    document.getElementById('modalPrice').innerHTML = `${room.price}<span>/ night</span>`;
    document.getElementById('currentImage').textContent = '1';
    document.getElementById('totalImages').textContent = room.images.length;

    // Set amenities
    const amenitiesContainer = document.getElementById('modalAmenities');
    amenitiesContainer.innerHTML = '<h3><i class="fas fa-star"></i> Premium Amenities</h3><ul>' + room.amenities.map(amenity => 
        `<li><i class="${amenity.icon}"></i><span>${amenity.text}</span></li>`
    ).join('') + '</ul>';

    // Set thumbnails
    const thumbnailsContainer = document.getElementById('modalThumbnails');
    thumbnailsContainer.innerHTML = room.images.map((img, index) => 
        `<img src="${img}" alt="Room Image ${index + 1}" class="modal-thumbnail ${index === 0 ? 'active' : ''}" onclick="selectModalImage(${index})">`
    ).join('');

    // Set Book Now button link with room type parameter
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        bookNowBtn.href = `booking.html?room=${roomType}`;
    }

    // Show modal
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close room modal
function closeRoomModal() {
    const modal = document.getElementById('roomModal');
    if (modal) {
    modal.classList.remove('active');
        modal.style.display = 'none';
    document.body.style.overflow = '';
    }
}

// Change modal image (navigation)
function changeModalImage(direction) {
    currentImageIndex += direction;
    
    if (currentImageIndex < 0) {
        currentImageIndex = currentRoomImages.length - 1;
    } else if (currentImageIndex >= currentRoomImages.length) {
        currentImageIndex = 0;
    }

    updateModalImage();
}

// Select modal image from thumbnail
function selectModalImage(index) {
    currentImageIndex = index;
    updateModalImage();
}

// Update modal image display
function updateModalImage() {
    const mainImage = document.getElementById('modalMainImage');
    mainImage.style.opacity = '0';
    
    setTimeout(() => {
        mainImage.src = currentRoomImages[currentImageIndex];
        mainImage.style.opacity = '1';
        
        // Update counter
        document.getElementById('currentImage').textContent = currentImageIndex + 1;
        
        // Update active thumbnail
        const thumbnails = document.querySelectorAll('.modal-thumbnail');
        thumbnails.forEach((thumb, index) => {
            if (index === currentImageIndex) {
                thumb.classList.add('active');
            } else {
                thumb.classList.remove('active');
            }
        });
    }, 150);
}

// Load rooms from database
let roomsFromDatabase = [];

async function loadRoomsFromDatabase() {
    try {
        const response = await fetch('api/rooms.php');
        const data = await response.json();
        
        if (data.success && data.data) {
            roomsFromDatabase = data.data;
            displayRooms(roomsFromDatabase);
        } else {
            console.error('Failed to load rooms:', data.error);
            document.getElementById('roomsGrid').innerHTML = 
                '<div class="error-message" style="text-align: center; padding: 40px; color: #e74c3c;"><p>Failed to load rooms. Please try again later.</p></div>';
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        document.getElementById('roomsGrid').innerHTML = 
            '<div class="error-message" style="text-align: center; padding: 40px; color: #e74c3c;"><p>Error loading rooms. Please refresh the page.</p></div>';
    }
}

function displayRooms(rooms) {
    const roomsGrid = document.getElementById('roomsGrid');
    
    if (!rooms || rooms.length === 0) {
        roomsGrid.innerHTML = '<div class="no-rooms" style="text-align: center; padding: 40px; color: #666;"><p>No rooms available at the moment.</p></div>';
        return;
    }
    
    roomsGrid.innerHTML = rooms.map(room => {
        const imageUrl = room.image_url || 'images/default-room.jpg';
        const floorText = getFloorText(room.floor_number);
        const price = parseFloat(room.price_per_night || 0).toLocaleString('en-IN');
        
        // Store room data as JSON in data attribute for easy access
        const roomDataJson = JSON.stringify(room).replace(/"/g, '&quot;');
        
        return `
            <div class="room-item" data-room-id="${room.id}" data-room-data="${roomDataJson}">
                <div class="room-item-image">
                    <img src="${imageUrl}" alt="${room.room_name}" onerror="this.src='images/default-room.jpg'">
                    <div class="room-overlay">
                        <span class="view-gallery-btn"><i class="fas fa-images"></i> View Gallery</span>
                    </div>
                </div>
                <div class="room-item-info">
                    <h3>${room.room_name || 'Room'}</h3>
                    <p class="room-floor">${floorText}</p>
                    <p class="room-price">₹${price} <span>/ night</span></p>
                </div>
            </div>
        `;
    }).join('');
    
    // Add click handlers to room items
    const roomItems = document.querySelectorAll('.room-item');
    roomItems.forEach(item => {
        item.addEventListener('click', function(e) {
            // Don't trigger if clicking on the view gallery button
            if (e.target.closest('.view-gallery-btn')) {
                return;
            }
            
            // Get room data from data attribute
            const roomDataAttr = this.getAttribute('data-room-data');
            if (roomDataAttr) {
                try {
                    const room = JSON.parse(roomDataAttr.replace(/&quot;/g, '"'));
                    console.log('Opening modal for room:', room); // Debug
                    openRoomModalFromDatabase(room);
                } catch (error) {
                    console.error('Error parsing room data:', error);
                    // Fallback: try to find by ID
                    const roomId = parseInt(this.getAttribute('data-room-id'));
                    const room = roomsFromDatabase.find(r => {
                        const dbId = parseInt(r.id);
                        return dbId === roomId || r.id === roomId || r.id == roomId;
                    });
                    if (room) {
                        openRoomModalFromDatabase(room);
                    } else {
                        alert('Room information not available. Please refresh the page.');
                    }
                }
            } else {
                // Fallback: try to find by ID
                const roomId = parseInt(this.getAttribute('data-room-id'));
                const room = roomsFromDatabase.find(r => {
                    const dbId = parseInt(r.id);
                    return dbId === roomId || r.id === roomId || r.id == roomId;
                });
                if (room) {
                    openRoomModalFromDatabase(room);
                } else {
                    console.error('Room not found with ID:', roomId);
                    alert('Room information not available. Please refresh the page.');
                }
            }
        });
    });
    
    console.log('Room items click handlers attached:', roomItems.length); // Debug
    console.log('Rooms loaded:', roomsFromDatabase.length); // Debug
}

function getFloorText(floorNumber) {
    const floor = parseInt(floorNumber);
    if (isNaN(floor)) return 'Floor N/A';
    
    const suffix = floor === 1 ? 'st' : floor === 2 ? 'nd' : floor === 3 ? 'rd' : 'th';
    return `${floor}${suffix} Floor`;
}

function openRoomModalFromDatabase(room) {
    const modal = document.getElementById('roomModal');
    if (!modal) return;
    
    // Parse amenities from comma-separated string
    const amenitiesList = room.amenities ? room.amenities.split(',').map(a => a.trim()).filter(a => a) : [];
    
    // Create images array - use image_url as primary, add default images if needed
    const images = [];
    if (room.image_url) {
        images.push(room.image_url);
    }
    // Add some default images if only one image is available
    if (images.length === 1) {
        images.push('images/beach.jpg', 'images/pool.jpg', 'images/dining.jpg');
    }
    if (images.length === 0) {
        images.push('images/default-room.jpg', 'images/beach.jpg', 'images/pool.jpg');
    }
    
    currentRoomImages = images;
    currentImageIndex = 0;
    
    // Set main image
    document.getElementById('modalMainImage').src = images[0];
    document.getElementById('modalRoomName').textContent = room.room_name || 'Room';
    document.getElementById('modalFloor').textContent = getFloorText(room.floor_number);
    document.getElementById('modalDescription').textContent = room.description || 'No description available.';
    document.getElementById('modalPrice').innerHTML = `₹${parseFloat(room.price_per_night || 0).toLocaleString('en-IN')}<span>/ night</span>`;
    document.getElementById('currentImage').textContent = '1';
    document.getElementById('totalImages').textContent = images.length;
    
    // Set amenities
    const amenitiesContainer = document.getElementById('modalAmenities');
    if (amenitiesList.length > 0) {
        // Map common amenity names to icons
        const amenityIcons = {
            'wifi': 'fas fa-wifi',
            'wi-fi': 'fas fa-wifi',
            'air conditioning': 'fas fa-snowflake',
            'mini bar': 'fas fa-wine-glass-alt',
            'ocean view': 'fas fa-water',
            'balcony': 'fas fa-home',
            'living room': 'fas fa-couch',
            'kitchen': 'fas fa-utensils',
            'kitchenette': 'fas fa-utensils',
            'pool': 'fas fa-swimming-pool',
            'tv': 'fas fa-tv',
            'smart tv': 'fas fa-tv',
            'butler': 'fas fa-concierge-bell',
            'spa': 'fas fa-spa',
            'terrace': 'fas fa-home',
            'pool access': 'fas fa-swimming-pool'
        };
        
        const amenitiesHTML = amenitiesList.map(amenity => {
            const amenityLower = amenity.toLowerCase();
            let icon = 'fas fa-check-circle'; // Default icon
            for (const [key, iconClass] of Object.entries(amenityIcons)) {
                if (amenityLower.includes(key)) {
                    icon = iconClass;
                    break;
                }
            }
            return `<li><i class="${icon}"></i><span>${amenity}</span></li>`;
        }).join('');
        
        amenitiesContainer.innerHTML = '<h3><i class="fas fa-star"></i> Premium Amenities</h3><ul>' + amenitiesHTML + '</ul>';
    } else {
        amenitiesContainer.innerHTML = '<h3><i class="fas fa-star"></i> Premium Amenities</h3><ul><li><i class="fas fa-check-circle"></i><span>Standard amenities included</span></li></ul>';
    }
    
    // Set thumbnails
    const thumbnailsContainer = document.getElementById('modalThumbnails');
    thumbnailsContainer.innerHTML = images.map((img, index) => 
        `<div class="modal-thumbnail ${index === 0 ? 'active' : ''}" onclick="changeModalImageTo(${index})">
            <img src="${img}" alt="Room Image ${index + 1}" onerror="this.src='images/default-room.jpg'">
        </div>`
    ).join('');
    
    // Update Book Now button with room type
    const bookNowBtn = document.getElementById('bookNowBtn');
    if (bookNowBtn) {
        const roomType = room.room_type || room.room_name;
        bookNowBtn.href = `booking.html?room_type=${encodeURIComponent(roomType)}`;
    }
    
    // Show modal
    modal.classList.add('active');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    console.log('Modal opened for room:', room.room_name); // Debug log
}

function changeModalImageTo(index) {
    if (index >= 0 && index < currentRoomImages.length) {
        currentImageIndex = index;
        updateModalImage();
    }
}

// Initialize rooms page
document.addEventListener('DOMContentLoaded', function() {
    // Load rooms from database if on rooms page
    if (document.getElementById('roomsGrid')) {
        loadRoomsFromDatabase();
    }
    
    // Close modal handlers - use event delegation for dynamically added elements
    document.addEventListener('click', function(e) {
        // Close button click
        if (e.target.classList.contains('modal-close') || e.target.closest('.modal-close')) {
            closeRoomModal();
        }
    });

    // Close modal on background click
    const modal = document.getElementById('roomModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeRoomModal();
            }
        });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
        const modal = document.getElementById('roomModal');
        if (modal && (modal.classList.contains('active') || modal.style.display === 'flex')) {
            if (e.key === 'Escape') {
                closeRoomModal();
            } else if (e.key === 'ArrowLeft') {
                changeModalImage(-1);
            } else if (e.key === 'ArrowRight') {
                changeModalImage(1);
            }
        }
    });
});

// Initialize Book Now buttons on homepage
function initializeBookNowButtons() {
    // Hero section Book Now button
    const heroBookNowBtn = document.getElementById('heroBookNowBtn');
    if (heroBookNowBtn) {
        heroBookNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleBookNowClick();
        });
    }
    
    // CTA section Reserve Now button
    const ctaReserveNowBtn = document.getElementById('ctaReserveNowBtn');
    if (ctaReserveNowBtn) {
        ctaReserveNowBtn.addEventListener('click', function(e) {
            e.preventDefault();
            handleBookNowClick();
        });
    }
}

// Handle Book Now button click - check login status
function handleBookNowClick() {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (user || adminLoggedIn) {
        // User is logged in - redirect to booking page
        window.location.href = 'booking.html';
    } else {
        // User is not logged in - redirect to login page with return URL
        const returnUrl = encodeURIComponent('booking.html');
        window.location.href = `login.html?return=${returnUrl}`;
    }
}

// Add login-page class to body on login and register pages
document.addEventListener('DOMContentLoaded', function() {
    const loginMain = document.querySelector('.login-main');
    if (loginMain) {
        document.body.classList.add('login-page');
    }
});

// Forgot Password functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('forgot-password.html')) {
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('forgotEmail').value;
                const submitBtn = document.getElementById('sendOTPBtn');
                const originalText = submitBtn.innerHTML;
                
                // Show loading state
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending OTP...';
                submitBtn.disabled = true;
                
                try {
                    const response = await fetch('api/forgot-password.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: email
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // Show success message
                        document.getElementById('otpSentMessage').style.display = 'block';
                        forgotPasswordForm.style.display = 'none';
                        
                        // Store email in localStorage for reset password page
                        localStorage.setItem('resetEmail', email);
                    } else {
                        alert('Error: ' + data.error);
                    }
                } catch (error) {
                    console.error('Forgot password error:', error);
                    alert('Failed to send OTP. Please try again later.');
                } finally {
                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }
});

// Reset Password functionality
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('reset-password.html')) {
        // Pre-fill email if available
        const resetEmail = localStorage.getItem('resetEmail');
        if (resetEmail) {
            document.getElementById('resetEmail').value = resetEmail;
        }
        
        const resetPasswordForm = document.getElementById('resetPasswordForm');
        if (resetPasswordForm) {
            resetPasswordForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const email = document.getElementById('resetEmail').value;
                const otp = document.getElementById('resetOTP').value;
                const newPassword = document.getElementById('newPassword').value;
                const confirmPassword = document.getElementById('confirmPassword').value;
                
                // Validate passwords match
                if (newPassword !== confirmPassword) {
                    alert('Passwords do not match!');
                    return;
                }
                
                // Validate password length
                if (newPassword.length < 8) {
                    alert('Password must be at least 8 characters long!');
                    return;
                }
                
                const submitBtn = this.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                
                // Show loading state
                submitBtn.textContent = 'Resetting Password...';
                submitBtn.disabled = true;
                
                try {
                    const response = await fetch('api/reset-password.php', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            email: email,
                            otp: otp,
                            new_password: newPassword
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('Password reset successfully! Redirecting to login page...');
                        localStorage.removeItem('resetEmail');
                        window.location.href = 'login.html';
                    } else {
                        alert('Error: ' + data.error);
                    }
                } catch (error) {
                    console.error('Reset password error:', error);
                    alert('Failed to reset password. Please try again later.');
                } finally {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
    }
});