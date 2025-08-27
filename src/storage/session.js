export const startSession = (user, address) => {
  sessionStorage.setItem("email", user.email);
  sessionStorage.setItem("accessToken", user.accessToken);
  sessionStorage.setItem("address", address || "");
};

export const getSession = () => ({
  email: sessionStorage.getItem("email"),
  accessToken: sessionStorage.getItem("accessToken"),
  address: sessionStorage.getItem("address"),
});

export const endSession = () => sessionStorage.clear();

export const isLoggedIn = () => !!getSession().accessToken;
