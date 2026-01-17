import NextAuth, { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import CredentialsProvider from 'next-auth/providers/credentials';
import { MongoDBAdapter } from "@next-auth/mongodb-adapter";
import clientPromise from '@/config/mongodb';
import connectDB from '@/database/connectDB';
import User from '@/models/userModel';
import bcrypt from 'bcryptjs';

export const authOptions: AuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password');
        }

        await connectDB();
        const user = await User.findOne({ email: credentials.email });
        if (!user) throw new Error('No user found');

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) throw new Error('Invalid credentials');

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session }: any) {
      await connectDB();
      if (session?.user?.email) {
        const user = await User.findOne({ email: session.user.email });
        if (user) {
          (session.user as any).id = user._id.toString();
          (session.user as any).role = user.role;
          (session.user as any).isVerified = user.isVerified;
          session.user.name = user.name;
          session.user.image = user.image;
        }
      }
      return session;
    },
    async signIn({ user }: any) {
      await connectDB();
      const existingUser = await User.findOne({ email: user.email });
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash('random', 10);
        await User.create({
          name: user.name || 'Unnamed',
          email: user.email,
          image: user.image,
          password: hashedPassword,
          role: 'user',
        });
      }
      return true;
    },
  },
  session: { strategy: 'jwt' as const },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };