"use client"

import { useState } from "react"
import { GitBranch, GitCommit, GitMerge, MessageSquare, User, SplitSquareVertical, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Sample branches data
const branches = [
  { name: "main", isActive: true },
  { name: "feature/parks", isActive: false },
  { name: "analysis/population", isActive: false },
]

interface VersionControlProps {
  onCompareVersions?: (version1: string, version2: string) => void
  commits?: Array<{
    id: string
    message: string
    author: string
    timestamp: string
    date: string
    isLlm?: boolean
    isMerge?: boolean
  }>
}

export function VersionControl({ onCompareVersions, commits = [] }: VersionControlProps) {
  const [activeTab, setActiveTab] = useState<"commits" | "branches">("commits")
  const [selectedCommit, setSelectedCommit] = useState<string | null>(null)
  const [selectedCommits, setSelectedCommits] = useState<string[]>([])
  const [compareMode, setCompareMode] = useState(false)
  const [currentHead, setCurrentHead] = useState(commits.length > 0 ? commits[0].id : "")

  // Use provided commits or fallback to empty array
  const commitHistory = commits.length > 0 ? commits : []

  const toggleCommitSelection = (commitId: string) => {
    if (compareMode) {
      if (selectedCommits.includes(commitId)) {
        setSelectedCommits(selectedCommits.filter((id) => id !== commitId))
      } else {
        // Only allow selecting up to 2 commits in compare mode
        if (selectedCommits.length < 2) {
          setSelectedCommits([...selectedCommits, commitId])
        } else {
          // Replace the oldest selected commit
          setSelectedCommits([selectedCommits[1], commitId])
        }
      }
    } else {
      setSelectedCommit(commitId === selectedCommit ? null : commitId)
    }
  }

  const handleCompareSelected = () => {
    if (selectedCommits.length === 2 && onCompareVersions) {
      // Pass the selected commit IDs to the parent component for comparison
      onCompareVersions(selectedCommits[0], selectedCommits[1])
    }
  }

  const toggleCompareMode = () => {
    setCompareMode(!compareMode)
    if (!compareMode) {
      setSelectedCommit(null)
    } else {
      setSelectedCommits([])
    }
  }

  const makeCurrentVersion = (commitId: string) => {
    // In a real app, this would update the repository head
    setCurrentHead(commitId)
    setSelectedCommit(null)
  }

  return (
    <TooltipProvider>
      <div className="flex h-[500px] flex-col">
        <div className="flex border-b border-border mt-2">
          <Button
            variant="ghost"
            size="sm"
            className={`w-1/2 rounded-none border-b-2 border-transparent px-0 py-2 text-xs font-medium ${
              activeTab === "commits"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("commits")}
          >
            <GitCommit className="mr-1.5 h-3.5 w-3.5" />
            Commits
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`w-1/2 rounded-none border-b-2 border-transparent px-0 py-2 text-xs font-medium ${
              activeTab === "branches"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
            onClick={() => setActiveTab("branches")}
          >
            <GitBranch className="mr-1.5 h-3.5 w-3.5" />
            Branches
          </Button>
        </div>

        <ScrollArea className="flex-1 px-2 py-2 h-full">
          {activeTab === "commits" && (
            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs font-medium">History</span>
              <Button
                variant={compareMode ? "default" : "outline"}
                size="sm"
                className={`h-6 px-2 text-[10px] ${compareMode ? "bg-blue-600" : ""}`}
                onClick={toggleCompareMode}
              >
                <SplitSquareVertical className="mr-1 h-3 w-3" />
                {compareMode ? "Cancel Compare" : "Compare Mode"}
              </Button>
            </div>
          )}

          {compareMode && selectedCommits.length > 0 && (
            <div className="mb-3 rounded-md bg-blue-500/10 p-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-blue-400">
                  {selectedCommits.length === 1 ? "Select one more commit to compare" : "Ready to compare"}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 border-blue-500/20 bg-blue-500/10 px-2 text-[10px] text-blue-400 hover:bg-blue-500/20"
                  disabled={selectedCommits.length !== 2}
                  onClick={handleCompareSelected}
                >
                  Compare Selected
                </Button>
              </div>
              {selectedCommits.length === 2 && (
                <div className="mt-2 flex items-center gap-1 text-[10px]">
                  <span className="rounded bg-blue-500/20 px-1 py-0.5 text-blue-400">
                    {commitHistory.find((c) => c.id === selectedCommits[0])?.message.substring(0, 15)}...
                  </span>
                  <span>vs</span>
                  <span className="rounded bg-blue-500/20 px-1 py-0.5 text-blue-400">
                    {commitHistory.find((c) => c.id === selectedCommits[1])?.message.substring(0, 15)}...
                  </span>
                </div>
              )}
            </div>
          )}

          {activeTab === "commits" ? (
            <div className="relative space-y-3 pl-3">
              {/* Timeline line */}
              <div className="absolute left-1.5 top-0 h-full w-0.5 bg-border"></div>

              {commitHistory.map((commit, index) => (
                <div
                  key={commit.id}
                  className={`relative ${
                    compareMode && selectedCommits.includes(commit.id)
                      ? "bg-blue-500/10 border border-blue-500/30"
                      : selectedCommit === commit.id
                        ? "bg-[#2A2A32]"
                        : ""
                  } rounded-md p-2 pl-4 transition-colors cursor-pointer ${
                    currentHead === commit.id ? "border-l-2 border-l-blue-500" : ""
                  }`}
                  onClick={() => toggleCommitSelection(commit.id)}
                >
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-3 top-3 z-10 flex h-5 w-5 items-center justify-center rounded-full border ${
                      commit.isLlm
                        ? "border-blue-500 bg-[#1A1A1E]"
                        : commit.isMerge
                          ? "border-blue-500 bg-[#1A1A1E]"
                          : "border-blue-500 bg-[#1A1A1E]"
                    }`}
                  >
                    {commit.isLlm ? (
                      <MessageSquare className="h-2.5 w-2.5 text-blue-400" />
                    ) : commit.isMerge ? (
                      <GitMerge className="h-2.5 w-2.5 text-blue-400" />
                    ) : (
                      <GitCommit className="h-2.5 w-2.5 text-blue-400" />
                    )}
                  </div>

                  <div className="mb-1 flex items-start justify-between">
                    <h4 className="text-xs font-medium leading-tight">
                      {commit.message}
                      {currentHead === commit.id && (
                        <Badge className="ml-1.5 bg-blue-500/20 text-[9px] text-blue-400">current</Badge>
                      )}
                    </h4>
                    {compareMode && (
                      <div className="ml-2 h-4 w-4 rounded-full border border-blue-500 bg-blue-500/10 flex items-center justify-center">
                        {selectedCommits.includes(commit.id) && (
                          <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{commit.author}</span>
                    </div>
                    <span className="text-muted-foreground">{commit.timestamp}</span>
                  </div>

                  {selectedCommit === commit.id && !compareMode && (
                    <div className="mt-2 flex items-center justify-end gap-1.5">
                      {currentHead !== commit.id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-6 border-blue-500/20 bg-blue-500/10 px-2 text-[10px] text-blue-400 hover:bg-blue-500/20"
                              onClick={(e) => {
                                e.stopPropagation()
                                makeCurrentVersion(commit.id)
                              }}
                            >
                              <RotateCcw className="mr-1 h-3 w-3" />
                              Revert to this version
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" className="text-xs">
                            <p>Make this the current version</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 border-blue-500/20 bg-blue-500/10 px-2 text-[10px] text-blue-400 hover:bg-blue-500/20"
                        onClick={(e) => {
                          e.stopPropagation()
                          setCompareMode(true)
                          setSelectedCommits([commit.id])
                        }}
                      >
                        Compare
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className={`flex items-center rounded-md p-2 text-xs ${
                    branch.isActive ? "bg-blue-500/10 text-blue-400" : ""
                  }`}
                >
                  <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                  {branch.name}
                  {branch.isActive && (
                    <Badge
                      variant="outline"
                      className="ml-auto h-4 border-blue-500 bg-blue-500/10 px-1 text-[9px] text-blue-400"
                    >
                      current
                    </Badge>
                  )}
                </div>
              ))}
              <Separator className="my-2" />
              <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                <GitBranch className="mr-1.5 h-3.5 w-3.5" />
                Create New Branch
              </Button>
            </div>
          )}
        </ScrollArea>
      </div>
    </TooltipProvider>
  )
}
