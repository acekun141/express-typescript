import * as mongoose from "mongoose";
import User from "./user.interface";

const userProfile = new mongoose.Schema({
  sex: {
    type: Number,
    enum: [0, 1],
    required: true
  },
  age: {
    type: Number,
    required: true
  },
  base64Logo: {
    type: String,
    required: true
  }
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  fullname: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  profile: userProfile
})

const userModel = mongoose.model<User & mongoose.Document>('User', userSchema);

export default userModel;