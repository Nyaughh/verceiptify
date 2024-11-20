'use client'



import { useEffect, useState, useRef } from 'react';

import { Card } from "@/components/ui/card";

import { Printer } from 'lucide-react';

import VercelBackground from '@/components/ui/vercel-bg';

import axios from 'axios';

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { ScrollArea } from "@/components/ui/scroll-area";

import { toPng } from 'html-to-image';

import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import { Info, Loader } from 'lucide-react';



interface User {

  uid: string;

  email: string;

  name: string;

  username: string;

}



interface Project {

  id: string;

  name: string;

  latestDeployments: any[];

}



interface Team {

  id: string;

  name: string;

}



export default function Home() {

  const [userToken, setUserToken] = useState<string>('');

  const [userData, setUserData] = useState<User | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);

  const [teams, setTeams] = useState<Team[]>([]);

  const [loading, setLoading] = useState(false);

  const [submitted, setSubmitted] = useState(false);

  const receiptRef = useRef<HTMLDivElement>(null);

  const [error, setError] = useState<string | null>(null);

  const [transactionId, setTransactionId] = useState<string>('');



  useEffect(() => {

    if (userToken) {

      setTransactionId(`TRX-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);

    }

  }, [userToken]);



  const apiEndPt = 'https://api.vercel.com/v9/projects';

  let config = {

    method: 'get',

    url: apiEndPt,

    headers: {

      Authorization: `Bearer ${userToken}`,

    },

  };



  async function fetchProjects(results: Project[]) {

    if (!userToken) {

      console.error('API token is required');

      return;

    }

    try {

      const response = await axios(config);

      results.push(...response.data.projects);

      if (response.data.pagination.next !== null) {

        config.url = `${apiEndPt}?until=${response.data.pagination.next}`;

        await fetchProjects(results);

      } else {

        setProjects(results);

      }

    } catch (error) {

      console.error('Error fetching projects:', error);

    }

  }



  const fetchData = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!userToken) {

      setError('API token is required');

      return;

    }

    setLoading(true);

    setError(null);

    try {

      // Fetch user data

      const userResponse = await fetch('https://api.vercel.com/v1/user', {

        headers: {

          Authorization: `Bearer ${userToken}`,

        },

      });



      if (!userResponse.ok) {

        throw new Error('Invalid API token');

      }



      const userData = await userResponse.json();

      setUserData(userData.user);



      // Fetch projects data

      let results: Project[] = [];

      await fetchProjects(results);



      // Fetch teams data

      const teamsResponse = await fetch('https://api.vercel.com/v1/teams', {

        headers: {

          Authorization: `Bearer ${userToken}`,

        },

      });



      if (!teamsResponse.ok) {

        throw new Error('Failed to fetch teams');

      }



      const teamsData = await teamsResponse.json();

      setTeams(teamsData.teams || []);



      setLoading(false);

      setSubmitted(true);

    } catch (error) {

      console.error('Error fetching data:', error);

      setError(error instanceof Error ? error.message : 'An unknown error occurred');

      setLoading(false);

    }

  };



  const downloadReceiptAsImage = () => {

    if (receiptRef.current === null) {

      return;

    }



    toPng(receiptRef.current)

      .then((dataUrl) => {

        const link = document.createElement('a');

        link.download = 'vercel-receipt.png';

        link.href = dataUrl;

        link.click();

      })

      .catch((error) => {

        console.error('Error generating image:', error);

      });

  };



  const totalDeployments = projects.reduce((acc, project) => acc + project.latestDeployments.length, 0);

  const averageDeployments = projects.length > 0 ? (totalDeployments / projects.length).toFixed(2) : 0;

  const mostActiveProject = projects.length > 0 
    ? projects.reduce((prev, current) => 
        (prev?.latestDeployments.length ?? 0) > (current?.latestDeployments.length ?? 0) ? prev : current)
    : null;



  const handleLogoClick = () => {

    setSubmitted(false);

  };



    return (
    <VercelBackground>

      <main className="flex flex-col items-center justify-center min-h-screen p-4">

        <div className="w-full max-w-[380px] flex flex-col items-center space-y-4">

          {!submitted && (

            <h1 className="text-4xl font-extrabold text-white mb-8" style={{ fontFamily: 'Inter, sans-serif' }}>

              Verceipts

            </h1>

          )}

          <div className="w-full flex items-center space-x-2">

            <form onSubmit={fetchData} className="flex-grow flex space-x-2">

              <Input

                type="text"

                placeholder="Enter your Vercel API Token"

                value={userToken}

                onChange={(e) => setUserToken(e.target.value)}

                className="flex-grow bg-gray-900 border border-gray-800 text-white placeholder-gray-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"

              />

              <Button 

                type="submit"

                className="bg-white hover:bg-gray-200 text-black font-medium py-2 px-4 rounded-md transition-colors duration-200 h-10 w-24 flex items-center justify-center"

              >

                {loading ? <Loader className="animate-spin" size={16} /> : 'Submit'}

              </Button>

              {submitted && !loading && (

                <Button 

                  onClick={downloadReceiptAsImage}

                  className="bg-white hover:bg-gray-200 text-black font-medium py-2 px-4 rounded-md transition-colors duration-200 h-10 w-24"

                >

                  Download

                </Button>

              )}

            </form>

            <div className="flex items-center">

              <TooltipProvider>

                <Tooltip>

                  <TooltipTrigger>

                    <Info className="text-gray-500 cursor-pointer" size={20} />

                  </TooltipTrigger>

                  <TooltipContent>

                    <p>

                      Get your API token from <a href="https://vercel.com/account/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Vercel</a>. Set scope to full account, and expiration to 1 day.

                    </p>

                  </TooltipContent>

                </Tooltip>

              </TooltipProvider>

            </div>

          </div>

          {error && <p className="text-red-500 mt-2">{error}</p>}

        </div>

        {submitted && (

          <>

            <h1

              className="absolute top-4 left-4 text-2xl font-extrabold text-white cursor-pointer"

              style={{ fontFamily: 'Inter, sans-serif' }}

              onClick={handleLogoClick}

            >

              Verceipts

            </h1>

            <ScrollArea className="w-full max-w-[380px] mt-8 h-[500px]">

              {loading ? (

                <p className="text-center text-white">Loading...</p>

              ) : (

                <div ref={receiptRef}>

                  <Card className="bg-white shadow-lg font-mono text-[11px] leading-tight border-none">

                    <div className="p-6 space-y-4">

                      <div className="text-center space-y-1">

                        <h1 className="text-xl font-bold tracking-tight">VERCEL RECEIPT</h1>

                        <p>Generated for: {userData?.name}</p>

                        <p>Email: {userData?.email}</p>

                        <p>Username: {userData?.username}</p>

                      </div>



                      <div className="border-t border-b border-dashed border-gray-300 py-2 space-y-1">

                        <p>Date: {new Date().toLocaleDateString()}</p>

                        <p>Time: {new Date().toLocaleTimeString()}</p>

                        <p>Transaction ID: {transactionId}</p>

                      </div>



                      <div className="space-y-1">

                        <div className="flex justify-between font-bold">

                          <span>Project</span>

                          <span>Deployments</span>

                        </div>

                        {projects.map((project) => (

                          <div key={project.id} className="flex justify-between">

                            <span className="w-1/2 truncate">{project.name}</span>

                            <span className="w-1/3 text-right">{project.latestDeployments.length}</span>

                          </div>

                        ))}

                        <div className="flex justify-between font-bold border-t border-dashed border-gray-300 pt-2">

                          <span>Total Projects Owned</span>

                          <span>{projects.length}</span>

                        </div>

                        <div className="flex justify-between font-bold">

                          <span>Total Deployments</span>

                          <span>{totalDeployments}</span>

                        </div>

                        <div className="flex justify-between font-bold">

                          <span>Average Deployments/Project</span>

                          <span>{averageDeployments}</span>

                        </div>

                        <div className="flex justify-between font-bold">

                          <span>Most Active Project</span>

                          <span>{mostActiveProject?.name || 'N/A'}</span>

                        </div>

                      </div>



                      <div className="space-y-1">

                        <h2 className="font-bold">Teams</h2>

                        {teams.map((team) => (

                          <div key={team.id} className="flex justify-between">

                            <span className="w-1/2 truncate">{team.name}</span>

                          </div>

                        ))}

                        <div className="flex justify-between font-bold">

                          <span>Total Teams</span>

                          <span>{teams.length}</span>

                        </div>

                      </div>



                      <div className="flex justify-center">

                        <img src="/barcode.png" alt="Barcode" className="w-30 h-30" />

                      </div>



                      <div className="text-center space-y-1">

                        <p className="font-bold">Thank you for using Vercel!</p>

                        <a href="https://verceipts.vercel.app/" className="text-[10px] text-blue-500 underline">

                          verceipts.vercel.app

                        </a>

                      </div>



                      <div className="flex items-center justify-center gap-2 text-gray-500">

                        <Printer size={14} />

                        <span className="text-[10px]">Printed on recycled paper</span>

                      </div>

                    </div>

                  </Card>

                </div>

              )}

            </ScrollArea>

          </>

        )}

        </main>
    </VercelBackground>

  );

}

