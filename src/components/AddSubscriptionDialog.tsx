import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, Subscription } from "@/lib/subscriptions";
import { useCurrency } from "@/lib/CurrencyContext";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (sub: Subscription) => void;
}

export default function AddSubscriptionDialog({ open, onOpenChange, onAdd }: Props) {
  const { currency } = useCurrency();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [billingCycle, setBillingCycle] = useState<"Monthly" | "Yearly">("Monthly");
  const [billingDate, setBillingDate] = useState("1");
  const [category, setCategory] = useState<string>("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    const finalCategory = category || "Other";
    onAdd({
      id: crypto.randomUUID(),
      name,
      amount: parseFloat(amount),
      currency,
      category,
      billingCycle,
      billingDate: parseInt(billingDate),
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
      icon: CATEGORY_ICONS[category] || CATEGORY_ICONS.Other,
      reminderDays: 1,
    });
    setName("");
    setAmount("");
    setBillingCycle("Monthly");
    setBillingDate("1");
    setCategory("Other");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground text-xl">New subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-sm">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Netflix"
              className="bg-muted border-border text-foreground focus-visible:ring-[#8100FF] focus-visible:border-[#8100FF]"
            />
          </div>

          {/* Amount */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-sm">Amount ({currency})</Label>
            <Input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="14.99"
              className="bg-muted border-border text-foreground focus-visible:ring-[#8100FF] focus-visible:border-[#8100FF]"
            />
          </div>

          {/* Billing Cycle */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-sm">Billing cycle</Label>
            <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as "Monthly" | "Yearly")}>
              <SelectTrigger className="bg-muted border-border text-foreground focus:ring-[#8100FF] focus:border-[#8100FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Billing Day */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-sm">Billing day</Label>
            <Select value={billingDate} onValueChange={setBillingDate}>
              <SelectTrigger className="bg-muted border-border text-foreground focus:ring-[#8100FF] focus:border-[#8100FF]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border max-h-60">
                {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                  <SelectItem key={day} value={day.toString()}>
                    Day {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category chips */}
          <div className="space-y-1.5">
            <Label className="text-muted-foreground text-sm">Category</Label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => {
                const isSelected = category === c;
                const color = CATEGORY_COLORS[c];
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory((prev) => (prev === c ? "" : c))}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border transition-colors"
                    style={{
                      borderColor: isSelected ? color : `${color}60`,
                      color: color,
                      backgroundColor: isSelected ? `${color}20` : `${color}10`,
                    }}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 border-border text-foreground hover:bg-muted"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 text-white hover:opacity-90"
              style={{ backgroundColor: "#8100FF" }}
            >
              Add
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
