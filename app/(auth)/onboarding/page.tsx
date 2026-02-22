'use client';

import { useOnboarding } from '@/hooks/use-onboarding';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function OnboardingPage() {
    const { mutate, isPending } = useOnboarding();

    const handleSubmit = (formData: FormData) => {
        mutate(formData);
    };

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gray-50 dark:bg-gray-900/50 p-4">
            <div className="w-full max-w-lg">
                <Card className="shadow-lg">
                    <CardHeader>
                        <CardTitle className="text-2xl font-bold text-center">Profile Setup</CardTitle>
                        <CardDescription className="text-center">
                            Tell us a bit about yourself so we can help you better.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form action={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input id="name" name="name" placeholder="John Doe" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="age">Age</Label>
                                    <Input id="age" name="age" type="number" placeholder="30" required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="history">Medical History (Optional)</Label>
                                <Textarea
                                    id="history"
                                    name="history"
                                    placeholder="Please list any allergies, past surgeries, or chronic conditions..."
                                    className="min-h-[100px]"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isPending}
                            >
                                {isPending ? 'Saving Profile...' : 'Complete Setup'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
