'use client';

import { useState } from 'react';
import Link from 'next/link';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ShoppingBag, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      setIsLoading(true);
      await resetPassword(data.email);
      setIsSuccess(true);
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-950 to-purple-950 text-white">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[400px] -left-[300px] w-[600px] h-[600px] rounded-full bg-purple-700/20 blur-[100px]"></div>
        <div className="absolute top-[100px] -right-[300px] w-[600px] h-[600px] rounded-full bg-blue-700/20 blur-[100px]"></div>
        <div className="absolute -bottom-[400px] left-[30%] w-[800px] h-[800px] rounded-full bg-pink-700/20 blur-[100px]"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen py-12 px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold">
              <ShoppingBag className="h-8 w-8 text-pink-400" />
              <span className="text-white">ShopSavvy</span>
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Reset your password</h2>
            <p className="mt-2 text-sm text-purple-200">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-8 shadow-lg rounded-lg border border-white/20">
            {isSuccess ? (
              <div className="space-y-6">
                <Alert className="border-pink-500/50 bg-pink-500/10 text-white">
                  <AlertTitle className="text-white">Check your email</AlertTitle>
                  <AlertDescription className="text-white/80">
                    We've sent you a password reset link. Please check your email and follow the instructions.
                  </AlertDescription>
                </Alert>
                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                >
                  <Link href="/login">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to login
                  </Link>
                </Button>
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">Email address</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            {...field}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-500 focus:ring-pink-500"
                          />
                        </FormControl>
                        <FormMessage className="text-pink-300" />
                      </FormItem>
                    )}
                  />

                  <div className="flex flex-col space-y-4">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white border-0"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending reset link...
                        </>
                      ) : (
                        'Send reset link'
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      asChild
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Link href="/login">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to login
                      </Link>
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
