// Admin Dashboard JavaScript

// Admin credentials (in production, this should be in database)
const ADMIN_CREDENTIALS = {
    email: 'admin@gmail.com',
    password: 'admin123'
};

// Check admin login status
document.addEventListener('DOMContentLoaded', function() {
    const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    
    if (adminLoggedIn) {
        showAdminDashboard();
    } else {
        showAdminLogin();
    }

    // Admin login form
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = document.getElementById('adminEmail').value;
            const password = document.getElementById('adminPassword').value;

            if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
                localStorage.setItem('adminLoggedIn', 'true');
                showAdminDashboard();
            } else {
                alert('Invalid admin credentials!');
            }
        });
    }

    // Admin logout
    const adminLogout = document.getElementById('adminLogout');
    if (adminLogout) {
        adminLogout.addEventListener('click', function(e) {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                localStorage.removeItem('adminLoggedIn');
                showAdminLogin();
            }
        });
    }

    // Tab switching
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('data-tab');
            switchTab(tabName);
        });
    });

    // Modal close handlers
    const modalCloses = document.querySelectorAll('.modal-close');
    modalCloses.forEach(close => {
        close.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Add room button
    const addRoomBtn = document.getElementById('addRoomBtn');
    if (addRoomBtn) {
        addRoomBtn.addEventListener('click', function() {
            openRoomModal();
        });
    }

    // Room form submit
    const roomForm = document.getElementById('roomForm');
    if (roomForm) {
        roomForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveRoom();
        });
    }

    // Filter and search handlers
    const bookingStatusFilter = document.getElementById('bookingStatusFilter');
    if (bookingStatusFilter) {
        bookingStatusFilter.addEventListener('change', loadAllBookings);
    }

    const bookingSearch = document.getElementById('bookingSearch');
    if (bookingSearch) {
        bookingSearch.addEventListener('input', debounce(loadAllBookings, 300));
    }

    const userSearch = document.getElementById('userSearch');
    if (userSearch) {
        userSearch.addEventListener('input', debounce(loadAllUsers, 300));
    }

    const reportPeriod = document.getElementById('reportPeriod');
    if (reportPeriod) {
        reportPeriod.addEventListener('change', loadReports);
    }
});

function showAdminLogin() {
    document.getElementById('adminLoginSection').style.display = 'flex';
    document.getElementById('adminDashboard').style.display = 'none';
}

function showAdminDashboard() {
    document.getElementById('adminLoginSection').style.display = 'none';
    document.getElementById('adminDashboard').style.display = 'block';
    loadDashboardStats();
    loadAllBookings();
    loadAllUsers();
    loadAllRooms();
    loadReports();
}

function switchTab(tabName) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabName) {
            btn.classList.add('active');
        }
    });

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
        if (content.id === tabName + 'Tab') {
            content.classList.add('active');
        }
    });

    // Load data for the active tab
    if (tabName === 'bookings') {
        loadAllBookings();
    } else if (tabName === 'users') {
        loadAllUsers();
    } else if (tabName === 'rooms') {
        loadAllRooms();
    } else if (tabName === 'reports') {
        loadReports();
    }
}

// Load Dashboard Statistics
async function loadDashboardStats() {
    try {
        // Load bookings
        const bookingsResponse = await fetch('api/admin/bookings.php');
        const bookingsData = await bookingsResponse.json();
        
        // Load users
        const usersResponse = await fetch('api/admin/users.php');
        const usersData = await usersResponse.json();
        
        // Load rooms
        const roomsResponse = await fetch('api/rooms.php');
        const roomsData = await roomsResponse.json();

        if (bookingsData.success) {
            const bookings = bookingsData.data || [];
            document.getElementById('totalBookings').textContent = bookings.length;
            
            const pending = bookings.filter(b => b.booking_status === 'pending').length;
            const confirmed = bookings.filter(b => b.booking_status === 'confirmed').length;
            
            document.getElementById('pendingBookings').textContent = pending;
            document.getElementById('confirmedBookings').textContent = confirmed;
            
            const revenue = bookings
                .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
                .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
            document.getElementById('totalRevenue').textContent = '₹' + revenue.toFixed(2);
        }

        if (usersData.success) {
            document.getElementById('totalUsers').textContent = (usersData.data || []).length;
        }

        if (roomsData.success) {
            document.getElementById('totalRooms').textContent = (roomsData.data || []).length;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load All Bookings
async function loadAllBookings() {
    try {
        const response = await fetch('api/admin/bookings.php');
        const data = await response.json();
        
        const tbody = document.getElementById('bookingsTableBody');
        const statusFilter = document.getElementById('bookingStatusFilter')?.value || 'all';
        const searchTerm = document.getElementById('bookingSearch')?.value.toLowerCase() || '';

        if (data.success && data.data) {
            let bookings = data.data;
            
            // Apply filters
            if (statusFilter !== 'all') {
                bookings = bookings.filter(b => b.booking_status === statusFilter);
            }
            
            if (searchTerm) {
                bookings = bookings.filter(b => 
                    (b.guest_name && b.guest_name.toLowerCase().includes(searchTerm)) ||
                    (b.room_name && b.room_name.toLowerCase().includes(searchTerm)) ||
                    (b.guest_email && b.guest_email.toLowerCase().includes(searchTerm))
                );
            }

            if (bookings.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" class="no-data">No bookings found</td></tr>';
                return;
            }

            tbody.innerHTML = bookings.map(booking => {
                const checkIn = new Date(booking.check_in_date).toLocaleDateString();
                const checkOut = new Date(booking.check_out_date).toLocaleDateString();
                const statusClass = booking.booking_status || 'pending';
                
                return `
                    <tr>
                        <td>${booking.id || booking.booking_id}</td>
                        <td>${booking.guest_name || 'N/A'}</td>
                        <td>${booking.room_name || 'N/A'}</td>
                        <td>${checkIn}</td>
                        <td>${checkOut}</td>
                        <td>${booking.number_of_guests || 0}</td>
                        <td>₹${parseFloat(booking.total_amount || 0).toFixed(2)}</td>
                        <td><span class="status ${statusClass}">${statusClass}</span></td>
                        <td>
                            <button class="btn-small" onclick="viewBooking(${booking.id || booking.booking_id})">
                                <i class="fas fa-eye"></i>
                            </button>
                            ${statusClass === 'pending' ? `
                                <button class="btn-small btn-success" onclick="updateBookingStatus(${booking.id || booking.booking_id}, 'confirmed')">
                                    <i class="fas fa-check"></i>
                                </button>
                                <button class="btn-small btn-danger" onclick="updateBookingStatus(${booking.id || booking.booking_id}, 'cancelled')">
                                    <i class="fas fa-times"></i>
                                </button>
                            ` : ''}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="9" class="no-data">No bookings found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading bookings:', error);
        document.getElementById('bookingsTableBody').innerHTML = 
            '<tr><td colspan="9" class="error">Error loading bookings</td></tr>';
    }
}

// Load All Users
async function loadAllUsers() {
    try {
        const response = await fetch('api/admin/users.php');
        const data = await response.json();
        
        const tbody = document.getElementById('usersTableBody');
        const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';

        if (data.success && data.data) {
            let users = data.data;
            
            if (searchTerm) {
                users = users.filter(u => 
                    (u.first_name && u.first_name.toLowerCase().includes(searchTerm)) ||
                    (u.last_name && u.last_name.toLowerCase().includes(searchTerm)) ||
                    (u.email && u.email.toLowerCase().includes(searchTerm))
                );
            }

            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
                return;
            }

            // Get booking counts for each user
            const bookingsResponse = await fetch('api/admin/bookings.php');
            const bookingsData = await bookingsResponse.json();
            const bookings = bookingsData.success ? bookingsData.data : [];
            
            tbody.innerHTML = users.map(user => {
                const userBookings = bookings.filter(b => b.user_id === user.id).length;
                const memberSince = new Date(user.created_at).toLocaleDateString();
                
                return `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.first_name} ${user.last_name}</td>
                        <td>${user.email}</td>
                        <td>${user.phone}</td>
                        <td>${user.country}</td>
                        <td>${memberSince}</td>
                        <td>${userBookings}</td>
                        <td>
                            <button class="btn-small" onclick="viewUser(${user.id})">
                                <i class="fas fa-eye"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No users found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTableBody').innerHTML = 
            '<tr><td colspan="8" class="error">Error loading users</td></tr>';
    }
}

// Load All Rooms
async function loadAllRooms() {
    try {
        const response = await fetch('api/rooms.php');
        const data = await response.json();
        
        const tbody = document.getElementById('roomsTableBody');

        if (data.success && data.data) {
            if (data.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="no-data">No rooms found</td></tr>';
                return;
            }

            tbody.innerHTML = data.data.map(room => {
                return `
                    <tr>
                        <td>${room.id}</td>
                        <td>${room.room_name}</td>
                        <td>${room.room_type}</td>
                        <td>${room.floor_number}</td>
                        <td>₹${parseFloat(room.price_per_night || 0).toFixed(2)}</td>
                        <td>${room.max_occupancy}</td>
                        <td><span class="status ${room.is_available ? 'confirmed' : 'cancelled'}">${room.is_available ? 'Available' : 'Unavailable'}</span></td>
                        <td>
                            <button class="btn-small" onclick="editRoom(${room.id})">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn-small btn-danger" onclick="deleteRoom(${room.id})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tbody.innerHTML = '<tr><td colspan="8" class="no-data">No rooms found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
        document.getElementById('roomsTableBody').innerHTML = 
            '<tr><td colspan="8" class="error">Error loading rooms</td></tr>';
    }
}

// Load Reports
async function loadReports() {
    try {
        const response = await fetch('api/admin/bookings.php');
        const data = await response.json();
        const period = document.getElementById('reportPeriod')?.value || 'all';
        
        if (data.success && data.data) {
            const bookings = data.data;
            const now = new Date();
            
            let filteredBookings = bookings;
            if (period !== 'all') {
                filteredBookings = bookings.filter(booking => {
                    const bookingDate = new Date(booking.created_at || booking.booking_date);
                    switch(period) {
                        case 'today':
                            return bookingDate.toDateString() === now.toDateString();
                        case 'week':
                            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            return bookingDate >= weekAgo;
                        case 'month':
                            return bookingDate.getMonth() === now.getMonth() && 
                                   bookingDate.getFullYear() === now.getFullYear();
                        case 'year':
                            return bookingDate.getFullYear() === now.getFullYear();
                        default:
                            return true;
                    }
                });
            }

            // Booking Statistics
            const statusCounts = {
                pending: filteredBookings.filter(b => b.booking_status === 'pending').length,
                confirmed: filteredBookings.filter(b => b.booking_status === 'confirmed').length,
                cancelled: filteredBookings.filter(b => b.booking_status === 'cancelled').length,
                completed: filteredBookings.filter(b => b.booking_status === 'completed').length
            };

            document.getElementById('bookingStats').innerHTML = `
                <div class="stat-item">
                    <span>Pending: ${statusCounts.pending}</span>
                </div>
                <div class="stat-item">
                    <span>Confirmed: ${statusCounts.confirmed}</span>
                </div>
                <div class="stat-item">
                    <span>Cancelled: ${statusCounts.cancelled}</span>
                </div>
                <div class="stat-item">
                    <span>Completed: ${statusCounts.completed}</span>
                </div>
            `;

            // Revenue Statistics
            const revenue = filteredBookings
                .filter(b => b.booking_status === 'confirmed' || b.booking_status === 'completed')
                .reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);
            
            document.getElementById('revenueStats').innerHTML = `
                <div class="stat-item">
                    <span>Total Revenue: ₹${revenue.toFixed(2)}</span>
                </div>
                <div class="stat-item">
                    <span>Total Bookings: ${filteredBookings.length}</span>
                </div>
                <div class="stat-item">
                    <span>Average Booking: ₹${filteredBookings.length > 0 ? (revenue / filteredBookings.length).toFixed(2) : '0.00'}</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading reports:', error);
    }
}

// Update Booking Status
async function updateBookingStatus(bookingId, status) {
    if (!confirm(`Are you sure you want to ${status} this booking?`)) {
        return;
    }

    try {
        const response = await fetch('api/admin/bookings.php', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                booking_id: bookingId,
                status: status
            })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Booking status updated successfully!');
            loadAllBookings();
            loadDashboardStats();
        } else {
            alert('Failed to update booking: ' + data.error);
        }
    } catch (error) {
        console.error('Error updating booking:', error);
        alert('Failed to update booking. Please try again.');
    }
}

// View Booking Details
async function viewBooking(bookingId) {
    try {
        const response = await fetch(`api/admin/bookings.php?id=${bookingId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const booking = data.data;
            const modal = document.getElementById('bookingModal');
            const content = document.getElementById('bookingModalContent');
            
            content.innerHTML = `
                <div class="booking-details-view">
                    <p><strong>Guest:</strong> ${booking.guest_name || 'N/A'}</p>
                    <p><strong>Email:</strong> ${booking.guest_email || 'N/A'}</p>
                    <p><strong>Phone:</strong> ${booking.guest_phone || 'N/A'}</p>
                    <p><strong>Room:</strong> ${booking.room_name || 'N/A'}</p>
                    <p><strong>Check In:</strong> ${new Date(booking.check_in_date).toLocaleDateString()}</p>
                    <p><strong>Check Out:</strong> ${new Date(booking.check_out_date).toLocaleDateString()}</p>
                    <p><strong>Guests:</strong> ${booking.number_of_guests || 0}</p>
                    <p><strong>Amount:</strong> ₹${parseFloat(booking.total_amount || 0).toFixed(2)}</p>
                    <p><strong>Status:</strong> <span class="status ${booking.booking_status}">${booking.booking_status}</span></p>
                    ${booking.special_requests ? `<p><strong>Special Requests:</strong> ${booking.special_requests}</p>` : ''}
                    <p><strong>Booking Date:</strong> ${new Date(booking.created_at || booking.booking_date).toLocaleString()}</p>
                </div>
            `;
            
            modal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error loading booking:', error);
        alert('Failed to load booking details.');
    }
}

// View User Details
async function viewUser(userId) {
    try {
        const response = await fetch(`api/admin/users.php?id=${userId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const user = data.data;
            alert(`User Details:\n\nName: ${user.first_name} ${user.last_name}\nEmail: ${user.email}\nPhone: ${user.phone}\nCountry: ${user.country}\nMember Since: ${new Date(user.created_at).toLocaleDateString()}`);
        }
    } catch (error) {
        console.error('Error loading user:', error);
    }
}

// Room Management Functions
function openRoomModal(roomId = null) {
    const modal = document.getElementById('roomModal');
    const form = document.getElementById('roomForm');
    const title = document.getElementById('roomModalTitle');
    
    if (roomId) {
        title.textContent = 'Edit Room';
        loadRoomData(roomId);
    } else {
        title.textContent = 'Add New Room';
        form.reset();
        document.getElementById('roomId').value = '';
    }
    
    modal.style.display = 'block';
}

async function loadRoomData(roomId) {
    try {
        const response = await fetch(`api/rooms.php?id=${roomId}`);
        const data = await response.json();
        
        if (data.success && data.data) {
            const room = data.data;
            document.getElementById('roomId').value = room.id;
            document.getElementById('roomName').value = room.room_name || '';
            document.getElementById('roomType').value = room.room_type || '';
            document.getElementById('floorNumber').value = room.floor_number || '';
            document.getElementById('pricePerNight').value = room.price_per_night || '';
            document.getElementById('maxOccupancy').value = room.max_occupancy || '';
            document.getElementById('roomDescription').value = room.description || '';
            document.getElementById('roomAmenities').value = room.amenities || '';
            document.getElementById('roomImageUrl').value = room.image_url || '';
            document.getElementById('roomAvailable').checked = room.is_available !== false;
        }
    } catch (error) {
        console.error('Error loading room:', error);
    }
}

async function saveRoom() {
    try {
        const roomData = {
            id: document.getElementById('roomId').value || null,
            room_name: document.getElementById('roomName').value,
            room_type: document.getElementById('roomType').value,
            floor_number: parseInt(document.getElementById('floorNumber').value),
            price_per_night: parseFloat(document.getElementById('pricePerNight').value),
            max_occupancy: parseInt(document.getElementById('maxOccupancy').value),
            description: document.getElementById('roomDescription').value,
            amenities: document.getElementById('roomAmenities').value,
            image_url: document.getElementById('roomImageUrl').value,
            is_available: document.getElementById('roomAvailable').checked
        };

        const url = roomData.id ? 'api/admin/rooms.php' : 'api/admin/rooms.php';
        const method = roomData.id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(roomData)
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Room saved successfully!');
            document.getElementById('roomModal').style.display = 'none';
            loadAllRooms();
            loadDashboardStats();
        } else {
            alert('Failed to save room: ' + data.error);
        }
    } catch (error) {
        console.error('Error saving room:', error);
        alert('Failed to save room. Please try again.');
    }
}

function editRoom(roomId) {
    openRoomModal(roomId);
}

async function deleteRoom(roomId) {
    if (!confirm('Are you sure you want to delete this room?')) {
        return;
    }

    try {
        const response = await fetch('api/admin/rooms.php', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: roomId })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Room deleted successfully!');
            loadAllRooms();
            loadDashboardStats();
        } else {
            alert('Failed to delete room: ' + data.error);
        }
    } catch (error) {
        console.error('Error deleting room:', error);
        alert('Failed to delete room. Please try again.');
    }
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

