async function requerirSesion() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

async function cerrarSesion() {
  await supabase.auth.signOut();
  window.location.href = 'index.html';
}
