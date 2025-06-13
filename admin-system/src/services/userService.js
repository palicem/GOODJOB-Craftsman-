// admin-system/src/api/userService.js
import request from '@/utils/request'

// Get all users
export function getUserList(params) {
  return request({
    url: '/users',
    method: 'get',
    params
  })
}

// Get a single user by ID
export function getUserDetail(id) {
  return request({
    url: `/users/${id}`,
    method: 'get'
  })
}

// Add a new user
export function addUser(data) {
  return request({
    url: '/users',
    method: 'post',
    data
  })
}

// Update a user
export function updateUser(id, data) {
  return request({
    url: `/users/${id}`,
    method: 'put',
    data
  })
}

// Delete a user
export function deleteUser(id) {
  return request({
    url: `/users/${id}`,
    method: 'delete'
  })
} 