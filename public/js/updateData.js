import '@babel/polyfill';
import axios from 'axios';
import { showAlert } from './alert';

// type is 'data' or 'password'
export const updateSettings = async (data, type) => {
  try {
    const url = type == 'data' ? 'me' : 'updatePassword';

    const res = await axios({
      method: 'PATCH',
      url: `/api/v1/users/${url}`,
      data,
    });
    if (res.data.status === 'success')
      showAlert('success', `${type.toUpperCase()} was changed successfully!`);
  } catch (err) {
    showAlert('error', err.response.data.message);
  }
};
