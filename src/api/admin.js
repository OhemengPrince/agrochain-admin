import api from './axios';

// Users
export const getUsers = () => api.get('/admin/users');
export const suspendUser = (id) => api.patch(`/admin/users/${id}/suspend`);
export const activateUser = (id) => api.patch(`/admin/users/${id}/activate`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

// Transactions
export const getTransactions = () => api.get('/admin/transactions');

// Withdrawals
export const getWithdrawals = () => api.get('/admin/withdrawals');

// Bookings
export const getBookings = () => api.get('/admin/bookings');

// Listings — marketplace, produce batches, equipment
export const getMarketplaceListings = () => api.get('/admin/listings');
export const deleteMarketplaceListing = (id) => api.delete(`/admin/listings/${id}`);

export const getProduceBatches = () => api.get('/admin/produce-batches');
export const deleteProduceBatch = (id) => api.delete(`/admin/produce-batches/${id}`);

export const getEquipmentListings = () => api.get('/admin/equipment');
export const deleteEquipmentListing = (id) => api.delete(`/admin/equipment/${id}`);

// Notifications
export const sendNotification = (payload) => api.post('/admin/notifications/send', payload);
