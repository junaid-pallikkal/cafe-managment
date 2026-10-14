"use client";

import React, { useActionState, useState } from "react";
import { loginAction } from "@/server/actions/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  UtensilsCrossed,
  Shield,
  ConciergeBell,
  ChefHat,
  Receipt,
  ArrowRight,
  AlertCircle,
  KeyRound,
  User,
} from "lucide-react";
import { ActionResult } from "@/lib/permissions";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const [state, formAction, isPending] = useActionState(
    async (prevState: ActionResult<{ redirectUrl: string }> | null, formData: FormData) => {
      const res = await loginAction(prevState, formData);
      if (res.success && res.data.redirectUrl) {
        router.push(res.data.redirectUrl);
      }
      return res;
    },
    null
  );

  const fillDemoCredentials = (email: string) => {
    setEmailInput(email);
    setPasswordInput("DemoPass123!");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4 sm:p-6 text-foreground">
      <div className="w-full max-w-sm space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Emerald POS & Ops
          </h1>
          <p className="text-xs text-muted-foreground">
            Unified restaurant operations platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-border/80 bg-card text-foreground shadow-xs rounded-2xl">
          <CardHeader className="space-y-1 pb-3 pt-5 px-5">
            <CardTitle className="text-base font-bold text-foreground">Sign in to your shift</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Enter your staff credentials to access your station.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-5 pb-5">
            {state && !state.success && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
                <span>{state.error}</span>
              </div>
            )}

            <form action={formAction} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span>Username or Email</span>
                </label>
                <Input
                  name="emailOrUsername"
                  type="text"
                  placeholder="e.g. captain@restaurant.demo"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                  className="bg-card border-border/80 text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                  <KeyRound className="h-3 w-3 text-muted-foreground" />
                  <span>Password</span>
                </label>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  required
                  className="bg-card border-border/80 text-xs h-9"
                />
              </div>

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 transition-all shadow-xs gap-1.5 mt-1"
              >
                {isPending ? (
                  "Signing in..."
                ) : (
                  <>
                    <span>Enter Station</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Switcher for Evaluation */}
            <div className="pt-3 border-t border-border/60">
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                Quick Demo Accounts (Click to Fill):
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => fillDemoCredentials("captain@restaurant.demo")}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-primary/10 border border-border/70 hover:border-primary/40 text-left transition-colors"
                >
                  <ConciergeBell className="h-3.5 w-3.5 text-primary shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Captain</div>
                    <div className="text-[10px] text-muted-foreground">Floor orders</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials("kitchen@restaurant.demo")}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-chart-3/15 border border-border/70 hover:border-chart-3/40 text-left transition-colors"
                >
                  <ChefHat className="h-3.5 w-3.5 text-chart-3 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Kitchen</div>
                    <div className="text-[10px] text-muted-foreground">KDS display</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials("billing@restaurant.demo")}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-chart-4/15 border border-border/70 hover:border-chart-4/40 text-left transition-colors"
                >
                  <Receipt className="h-3.5 w-3.5 text-chart-4 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Billing</div>
                    <div className="text-[10px] text-muted-foreground">Cashier settlement</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => fillDemoCredentials("admin@restaurant.demo")}
                  className="flex items-center gap-2 p-2 rounded-lg bg-muted/40 hover:bg-chart-5/15 border border-border/70 hover:border-chart-5/40 text-left transition-colors"
                >
                  <Shield className="h-3.5 w-3.5 text-chart-5 shrink-0" />
                  <div>
                    <div className="font-semibold text-foreground text-xs">Admin</div>
                    <div className="text-[10px] text-muted-foreground">Oversight & menu</div>
                  </div>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
