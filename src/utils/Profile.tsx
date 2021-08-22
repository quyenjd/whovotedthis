import axios, { AxiosResponse } from 'axios';
import { isPlainObject, isString } from 'lodash';

const UserOperations = [
    'logout', // Log out
    'password:change', // Change password
    'poll:option:add', // Add option to poll
    'poll:option:edit', // Edit added option of poll
    'poll:option:remove', // Remove option from poll
    'poll:option:view', // View added option of poll
    'poll:vote', // Vote an option of a poll
    'portal' // View the portal
] as const;

export type UserOperation = typeof UserOperations[number];

const AdminOperations = [
    'logout', // Log out
    'password:change', // Change password
    'poll:add', // Add a poll
    'poll:limit', // Limit number of options per user
    'poll:remove', // Remove a poll
    'poll:stage:change', // Change stage of a poll
    'poll:update', // Update poll info
    'poll:viewinfo', // Get info of a poll
    'portal' // View the portal
] as const;

export type AdminOperation = typeof AdminOperations[number];

export default class Profile {
    protected static username = '';
    protected static password = '';
    protected static type: 'admin' | 'user' | null = null;

    private static loggedIn: string | false = false;

    public static login(username: string, password: string) {
        return username.length && password.length
            ? axios
                .post('/~/build/login', { username, password })
                .then((response) => {
                    this.checkResponse(response);
                    Profile.loggedIn = response.data._id;
                    return axios.get('/~/build/account/profile');
                })
                .then((response) => {
                    Profile.username = response.data.username;
                    Profile.password = password;
                    Profile.type = response.data.profile.type;
                })
                .catch((error) => {
                    this.clear();
                    throw error;
                })
            : Promise.resolve().then(() => {
                throw new Error('Username and password cannot be empty');
            });
    }

    public static reLogin() {
        // Check if user has been logged in first
        return axios.get('/~/build/account/profile').then((response) => {
            try {
                this.checkResponse(response);
                Profile.loggedIn = response.data._id;
                Profile.username = response.data.username;
                Profile.type = response.data.profile.type;
            } catch (err) {
                // If not, try logging in
                return this.login(Profile.username, Profile.password);
            }
        });
    }

    public static logout() {
        return this.require('logout')
            ? axios.post('/~/build/logout').then((response) => {
                this.checkResponse(response);
                this.clear();
            })
            : Promise.resolve().then(() => {
                throw new Error('You are not allowed to logout');
            });
    }

    public static require(operation: UserOperation | AdminOperation) {
        return Profile.loggedIn !== false &&
            ((Profile.type === 'admin' &&
                AdminOperations.indexOf(operation as AdminOperation) >= 0) ||
                (Profile.type === 'user' &&
                    UserOperations.indexOf(operation as UserOperation) >= 0))
            ? Profile.username
            : false;
    }

    public static changePassword(newPassword: string) {
        return this.require('password:change') && newPassword.length
            ? axios
                .request({
                    method: 'PATCH',
                    data: { password: newPassword },
                    url: '/~/build/account/profile'
                })
                .then((response) => {
                    this.checkResponse(response);
                    this.password = newPassword;
                })
            : Promise.resolve().then(() => {
                throw new Error(
                    newPassword.length
                        ? 'You are not allowed to change your password'
                        : 'Password cannot be empty'
                );
            });
    }

    public static signup(username: string, password: string) {
        return axios
            .post('/~/build/signup', { username, password, type: 'user' })
            .then((response) => {
                this.checkResponse(response);
                return this.login(username, password);
            });
    }

    private static clear() {
        Profile.username = Profile.password = '';
        Profile.type = null;
        Profile.loggedIn = false;
    }

    protected static checkResponse(response: AxiosResponse<any>) {
        if (Object.prototype.hasOwnProperty.call(response.data, 'error')) {
            throw new Error(response.data.error);
        }
        if (
            !isPlainObject(response.data) &&
            isString(response.data._id) &&
            isString(response.data.username) &&
            isPlainObject(response.data.profile) &&
            isString(response.data.profile.type)
        ) {
            throw new Error('Cannot parse the response from server');
        }
    }
}
