import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, Subscription } from "@/lib/subscriptions";

interface Props {
  onAdd: (sub: Subscription) => void;
}

export default function AddSubscriptionDialog({ onAdd }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<string>("Other");
  const [billingDate, setBillingDate] = useState("1");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !amount) return;
    onAdd({
      id: Date.now().toString(),
      name,
      amount: parseFloat(amount),
      currency: "€",
      category,
      billingDate: parseInt(billingDate),
      color: CATEGORY_COLORS[category] || CATEGORY_COLORS.Other,
      icon: CATEGORY_ICONS[category] || CATEGORY_ICONS.Other,
    });
    setName("");
    setAmount("");
    setCategory("Other");
    setBillingDate("1");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Subscription
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Add Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Netflix" className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground">Monthly Amount (€)</Label>
            <Input type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="9.99" className="bg-muted border-border text-foreground" />
          </div>
          <div>
            <Label className="text-muted-foreground">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-muted border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{CATEGORY_ICONS[c]} {c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-muted-foreground">Billing Day</Label>
            <Input type="number" min={1} max={31} value={billingDate} onChange={(e) => setBillingDate(e.target.value)} className="bg-muted border-border text-foreground" />
          </div>
          <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            Add
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
