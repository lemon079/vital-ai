'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Bot, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useSignup } from '@/hooks/use-auth';

export default function SignupPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { mutate, isPending } = useSignup();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);
        mutate(formData);
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 px-4">
            <div className="w-full max-w-md">
                <Card>
                    <CardHeader className="space-y-2 text-center">
                        <div className="flex justify-center mb-2">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
                                <Bot size={28} />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
                        <CardDescription>
                            Get started with your Medical AI Assistant
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="email">
                                    Email
                                </label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e: any) => setEmail(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="password">
                                    Password
                                </label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e: any) => setPassword(e.target.value)}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <Button className="w-full" type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Creating account...
                                    </>
                                ) : (
                                    'Sign Up'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="flex justify-center">
                        <p className="text-sm text-muted-foreground text-center">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary hover:underline">
                                Log in
                            </Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
