// This file contains TODOs for features that are already implemented
// Used to test superseded TODO detection

interface User {
  id: string;
  name: string;
  email: string;
}

class UserManager {
  private users: User[] = [];

  // TODO: Add user creation functionality
  // This is already implemented below - should be detected as superseded
  
  createUser(userData: Omit<User, 'id'>): User {
    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      ...userData
    };
    this.users.push(user);
    return user;
  }

  // TODO: Implement user search by email
  // This is already implemented below - should be detected as superseded
  
  findUserByEmail(email: string): User | undefined {
    return this.users.find(user => user.email === email);
  }

  // TODO: Add user update functionality
  // This is NOT implemented yet - should remain as active TODO
  
  getAllUsers(): User[] {
    return [...this.users];
  }

  // TODO: Implement user deletion
  // This is already implemented below - should be detected as superseded
  
  deleteUser(id: string): boolean {
    const index = this.users.findIndex(user => user.id === id);
    if (index !== -1) {
      this.users.splice(index, 1);
      return true;
    }
    return false;
  }
}

export { UserManager, User };