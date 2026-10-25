import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api/shared';

interface ApprovalRule {
  id: string;
  category: string;
  effect: string;
  params: Record<string, unknown> | null;
  note: string | null;
  enabled: boolean;
}

export function AgentAutonomySettings() {
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRule, setNewRule] = useState({
    category: 'scheduling',
    effect: 'ask',
    params: '',
    note: '',
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const res = await apiFetch('/agent/rules');
      const data = await res.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error('Failed to load rules:', err);
    }
  };

  const addRule = async () => {
    try {
      const params = newRule.params ? JSON.parse(newRule.params) : null;
      await apiFetch('/agent/rules', {
        method: 'POST',
        body: JSON.stringify({
          category: newRule.category,
          effect: newRule.effect,
          params,
          note: newRule.note,
        }),
      });
      setShowAddRule(false);
      setNewRule({ category: 'scheduling', effect: 'ask', params: '', note: '' });
      loadRules();
    } catch (err) {
      console.error('Failed to add rule:', err);
    }
  };

  const deleteRule = async (id: string) => {
    try {
      await apiFetch(`/agent/rules/${id}`, { method: 'DELETE' });
      loadRules();
    } catch (err) {
      console.error('Failed to delete rule:', err);
    }
  };

  const toggleRule = async (id: string, enabled: boolean) => {
    try {
      await apiFetch(`/agent/rules/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ enabled }),
      });
      loadRules();
    } catch (err) {
      console.error('Failed to toggle rule:', err);
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-4 py-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium leading-none">Standing Rules</Label>
        <Button size="sm" variant="outline" onClick={() => setShowAddRule(!showAddRule)}>
          <Plus className="h-4 w-4 mr-1" /> Add Rule
        </Button>
      </div>
      <p className="mt-0.5 text-xs text-[hsl(var(--muted-foreground))]">
        Rules your agent follows when you're not on the line
      </p>

      {showAddRule && (
        <Card className="mt-3 p-4 space-y-3">
          <div>
            <Label htmlFor="rule-category" className="text-xs">Category</Label>
            <Select value={newRule.category} onValueChange={(v) => setNewRule({ ...newRule, category: v })}>
              <SelectTrigger id="rule-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="scheduling">Scheduling</SelectItem>
                <SelectItem value="money">Money</SelectItem>
                <SelectItem value="personal_info">Personal Info</SelectItem>
                <SelectItem value="commitment">Commitment</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rule-effect" className="text-xs">Effect</Label>
            <Select value={newRule.effect} onValueChange={(v) => setNewRule({ ...newRule, effect: v })}>
              <SelectTrigger id="rule-effect">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="allow">Allow</SelectItem>
                <SelectItem value="deny">Deny</SelectItem>
                <SelectItem value="ask">Ask You</SelectItem>
                <SelectItem value="handoff">Handoff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="rule-params" className="text-xs">Parameters (JSON, optional)</Label>
            <Input
              id="rule-params"
              value={newRule.params}
              onChange={(e) => setNewRule({ ...newRule, params: e.target.value })}
              placeholder='{"threshold": 100}'
            />
          </div>
          <div>
            <Label htmlFor="rule-note" className="text-xs">Note</Label>
            <Textarea
              id="rule-note"
              value={newRule.note}
              onChange={(e) => setNewRule({ ...newRule, note: e.target.value })}
              placeholder="Why this rule exists"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={addRule}>Add</Button>
            <Button size="sm" variant="outline" onClick={() => setShowAddRule(false)}>Cancel</Button>
          </div>
        </Card>
      )}

      <div className="mt-3 space-y-2">
        {rules.map((rule) => (
          <Card key={rule.id} className="p-3 flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium capitalize">{rule.category}</span>
                <span className="text-xs text-muted-foreground">→ {rule.effect}</span>
                {!rule.enabled && <span className="text-xs text-muted-foreground">(disabled)</span>}
              </div>
              {rule.note && <p className="text-xs text-muted-foreground mt-1">{rule.note}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => toggleRule(rule.id, checked)}
              />
              <Button size="icon" variant="ghost" onClick={() => deleteRule(rule.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
        {rules.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-4">No rules yet. Add one above.</p>
        )}
      </div>
    </div>
  );
}
