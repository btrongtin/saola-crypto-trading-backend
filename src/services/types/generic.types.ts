interface IQuerystring {
  username: string;
  password: string;
}

interface IReply {
  success: boolean;
  message: string;
  data?: any;
}
