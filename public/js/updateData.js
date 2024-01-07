import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alert';

// type is 'data' or 'password'
export const updateSettings = async (data, type) => {
  try {
    const url = type == 'data' ? 'me' : 'updatePassword';

    const res = await axios({
      method: 'PATCH',
      url: `http://127.0.0.1:3000/api/v1/users/${url}`,
      data,
    });
    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} was changed successfully!`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
