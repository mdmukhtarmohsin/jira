"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";
import { FileText } from "lucide-react";

const sampleRetrospectiveMarkdown = `# Sprint Retrospective Demo - Sprint 23

This demonstrates how retrospectives are now rendered with markdown formatting in both the AI Insights page and dashboard panel.

## 🟢 What went well

- **Team collaboration** was excellent throughout the sprint
- Successfully implemented **user authentication flow** with zero bugs
- Dashboard UI components were delivered **2 days ahead of schedule**
- Database schema migration completed successfully with **95% test coverage**
- Code review process was streamlined, reducing review time by 40%

## 🔴 What didn't go well

- API rate limiting implementation faced unexpected challenges
- Email notification system was **not started** due to blocked dependencies
- Documentation updates were delayed due to resource constraints
- Some team members were **overloaded** with tasks while others had capacity

### Key Issues Identified:

1. **Scope creep**: 3 additional features were added mid-sprint
2. **Communication gaps**: Daily standups missed critical blocking dependencies
3. **Resource allocation**: Uneven task distribution across team members

## 🛠 Action items for next sprint

### High Priority Actions:
- [ ] **Redistribute workload** - balance tasks more evenly across team
- [ ] **Establish clear dependencies** before sprint start
- [ ] **Set scope freeze date** - no new features after day 3 of sprint

### Process Improvements:
- [ ] Implement **daily dependency check** in standups
- [ ] Create **documentation templates** to speed up docs writing
- [ ] Set up **automated testing** for API rate limiting features

### Tools & Practices:
- [ ] Adopt **pair programming** for complex features
- [ ] Use **time-boxing** for research tasks
- [ ] Implement **feature flags** for incremental rollouts

## 📊 Sprint metrics summary

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| **Completion rate** | 90% | 75% (6/8 tasks) | ⚠️ Below target |
| **Story points delivered** | 34 | 28 (82%) | ⚠️ Below target |
| **Delayed tasks** | 0 | 2 | ❌ Issues found |
| **Blocked tasks** | 0 | 1 | ❌ Issues found |
| **Bug rate** | <5% | 2% | ✅ Exceeded target |

### Velocity Trend:
- Sprint 21: 32 points
- Sprint 22: 30 points  
- **Sprint 23: 28 points** ⬇️ Declining trend

## 🎯 Key Takeaways

> **Focus for next sprint**: Balance workload and improve dependency management to prevent bottlenecks.

**Success Factors:**
- Clear task definitions
- Strong technical leadership
- Proactive bug prevention

**Areas for Improvement:**
- Sprint planning accuracy
- Cross-team coordination
- Time estimation skills

---

*This retrospective was generated using AI analysis of sprint data and team feedback.*`;

export default function MarkdownDemoPage() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center justify-center text-foreground">
          <FileText className="mr-3 h-8 w-8 text-blue-600 dark:text-blue-400" />
          Markdown Retrospective Demo
        </h1>
        <p className="text-muted-foreground">
          This page demonstrates how retrospectives are now beautifully rendered
          with markdown formatting
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            AI-Generated Sprint Retrospective
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Markdown content={sampleRetrospectiveMarkdown} />
        </CardContent>
      </Card>

      <div className="max-w-4xl mx-auto text-center">
        <p className="text-sm text-muted-foreground">
          This same formatting is now used in:
        </p>
        <ul className="text-sm text-muted-foreground mt-2 space-y-1">
          <li>
            • <strong>AI Insights page</strong> → Retrospectives tab
          </li>
          <li>
            • <strong>Dashboard</strong> → AI Insights panel → Retrospectives
            tab
          </li>
        </ul>
      </div>
    </div>
  );
}
