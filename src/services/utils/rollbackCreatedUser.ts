import firebase from '../../firebase/index';
export default async function (userId: string) {
  try {
    await firebase.auth().deleteUser(userId);
    // eslint-disable-next-line no-empty
  } catch (error) {}
}
