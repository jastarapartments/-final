// Аутентификация админа

// Проверка авторизации
function checkAuth() {
  return new Promise((resolve) => {
    auth.onAuthStateChanged((user) => {
      if (user) {
        resolve(user);
      } else {
        resolve(null);
      }
    });
  });
}

// Вход админа
async function adminLogin(email, password) {
  try {
    const userCredential = await auth.signInWithEmailAndPassword(email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Выход
async function adminLogout() {
  try {
    await auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Защита админ страницы
async function requireAuth() {
  const user = await checkAuth();
  if (!user) {
    window.location.href = 'admin.html#login';
    return null;
  }
  return user;
}


