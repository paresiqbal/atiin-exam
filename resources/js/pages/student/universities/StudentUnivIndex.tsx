"use client"

import { useState, useMemo } from "react"
import AppLayout from "@/layouts/app-layout"
import type { BreadcrumbItem } from "@/types"
import { Head } from "@inertiajs/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, BookOpen } from "lucide-react"

interface Major {
  id: number
  name: string
  description?: string
}

interface University {
  id: number
  name: string
  city: string
  country: string
  website?: string
  description?: string
  majors?: Major[]
}

interface StudentUnivIndexProps {
  universities: University[]
}

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Student Dashboard",
    href: "/student/dashboard",
  },
  { title: "Universities", href: "/student/universities" },
]

export default function StudentUnivIndex({ universities }: StudentUnivIndexProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedUniversity, setSelectedUniversity] = useState<University | null>(null)

  // Filter universities based on search query
  const filteredUniversities = useMemo(() => {
    return universities.filter(
      (uni) =>
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.majors?.some((major) => major.name.toLowerCase().includes(searchQuery.toLowerCase())),
    )
  }, [searchQuery, universities])

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Universities" />

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-slate-900 p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Explore Universities</h1>
            <p className="text-gray-600 dark:text-gray-400">Discover universities and their academic programs</p>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search universities or majors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Universities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{universities.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Programs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {universities.reduce((acc, uni) => acc + (uni.majors?.length || 0), 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">Results Found</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {filteredUniversities.length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Universities Grid */}
          <div className="space-y-4">
            {filteredUniversities.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredUniversities.map((university) => (
                  <Card
                    key={university.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => setSelectedUniversity(university)}
                  >
                    <CardHeader>
                      <div className="space-y-2">
                        <CardTitle className="text-xl">{university.name}</CardTitle>
                        <CardDescription className="flex items-center gap-2">
                          <span>
                            📍 {university.city}, {university.country}
                          </span>
                        </CardDescription>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {university.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {university.description}
                        </p>
                      )}

                      {/* Majors */}
                      {university.majors && university.majors.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <BookOpen className="w-4 h-4" />
                            Programs ({university.majors.length})
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {university.majors.slice(0, 3).map((major) => (
                              <Badge key={major.id} variant="secondary" className="text-xs">
                                {major.name}
                              </Badge>
                            ))}
                            {university.majors.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{university.majors.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Button */}
                      <Button
                        variant="outline"
                        className="w-full mt-2 bg-transparent"
                        onClick={() => setSelectedUniversity(university)}
                      >
                        View Details
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="text-center py-12">
                <CardContent className="space-y-4">
                  <Search className="w-12 h-12 text-gray-400 mx-auto" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">No universities found</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Try adjusting your search query</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selectedUniversity && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedUniversity(null)}
        >
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{selectedUniversity.name}</CardTitle>
                  <CardDescription className="mt-2">
                    📍 {selectedUniversity.city}, {selectedUniversity.country}
                  </CardDescription>
                </div>
                <button
                  onClick={() => setSelectedUniversity(null)}
                  className="text-2xl text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {selectedUniversity.description && (
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">About</h3>
                  <p className="text-gray-600 dark:text-gray-400">{selectedUniversity.description}</p>
                </div>
              )}

              {/* Programs List */}
              {selectedUniversity.majors && selectedUniversity.majors.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">Available Programs</h3>
                  </div>
                  <div className="space-y-2">
                    {selectedUniversity.majors.map((major) => (
                      <div key={major.id} className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                        <p className="font-medium text-gray-900 dark:text-white">{major.name}</p>
                        {major.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{major.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Website Link */}
              {selectedUniversity.website && (
                <div>
                  <a
                    href={selectedUniversity.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                  >
                    Visit University Website →
                  </a>
                </div>
              )}

              <Button className="w-full" size="lg">
                Enroll Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </AppLayout>
  )
}
