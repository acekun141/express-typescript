interface User {
  _id: string;
  username: string;
  fullname: string;
  email: string;
  password: string;
  profile?: {
    sex: number;
    age: number;
    base64Logo: string;
  }
}

export default User;