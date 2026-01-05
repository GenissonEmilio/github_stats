import { ImageResponse } from '@vercel/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// --- CONFIGURAÇÕES E UTILITÁRIOS ---

function calculateRank(commits: number, prs: number) {
  const score = commits + (prs * 5);
  
  if (score >= 2000) return { label: 'S+', color: '#ff00d4', shadow: '#ff00d4' };
  if (score >= 1000) return { label: 'S', color: '#00f0ff', shadow: '#00f0ff' };
  if (score >= 500)  return { label: 'A', color: '#50fa7b', shadow: '#50fa7b' };
  if (score >= 200)  return { label: 'B', color: '#f1fa8c', shadow: '#f1fa8c' };
  return { label: 'C', color: '#8be9fd', shadow: '#8be9fd' };
}

function getIconUrl(langName: string) {
  const map: Record<string, string> = {
    'C++': 'cplusplus',
    'C#': 'csharp',
    'Jupyter Notebook': 'jupyter',
    'CSS': 'css3',
    'HTML': 'html5',
    'GDScript': 'godot',
    'Java': 'java',
    'Python': 'python',
    'JavaScript': 'javascript',
    'TypeScript': 'typescript',
    'Shell': 'bash',
    'Vim Script': 'vim',
  };
  
  const slug = map[langName] || langName.toLowerCase().replace(/ /g, '');
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${slug}/${slug}-original.svg`;
}

// -- API ROUTE --

export async function GET(req: NextRequest) {
  const username = process.env.NEXT_PUBLIC_GITHUB_USERNAME;
  const token = process.env.GITHUB_TOKEN;
  const displayName = "GENISSON EMILIO"; 

  if (!username || !token) {
    return new Response("Faltam variáveis de ambiente.", { status: 500 });
  }

  const query = `
    query userInfo($login: String!) {
      user(login: $login) {
        contributionsCollection {
          totalCommitContributions
        }
        pullRequests(first: 1) {
          totalCount
        }
        repositories(ownerAffiliations: OWNER, isFork: false, first: 100, orderBy: {field: UPDATED_AT, direction: DESC}) {
          nodes {
            languages(first: 10, orderBy: {field: SIZE, direction: DESC}) {
              edges {
                size
                node {
                  color
                  name
                }
              }
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables: { login: username } }),
    });

    const json = await res.json();
    if (json.errors) throw new Error("GitHub API Error");

    const data = json.data.user;

    const langStats: Record<string, { size: number; color: string }> = {};
    let totalSize = 0;

    data.repositories.nodes.forEach((repo: any) => {
      repo.languages.edges.forEach((edge: any) => {
        const { name, color } = edge.node;
        const size = edge.size;
        if (!langStats[name]) langStats[name] = { size: 0, color };
        langStats[name].size += size;
        totalSize += size;
      });
    });

    const topLangs = Object.entries(langStats)
      .map(([name, stat]) => ({
        name,
        color: stat.color || '#ccc',
        percent: Math.round((stat.size / totalSize) * 100),
        size: stat.size,
        icon: getIconUrl(name)
      }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);

    const commits = data.contributionsCollection.totalCommitContributions;
    const prs = data.pullRequests.totalCount;
    const rank = calculateRank(commits, prs);

    // --- RENDERIZAÇÃO ALTA DEFINIÇÃO ---
    
    return new ImageResponse(
      (
        // CONTAINER EXTERNO
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            backgroundColor: '#030712',
        }}>
            <div
            style={{
                width: '550px',
                height: '280px',
                display: 'flex',
                flexDirection: 'column',
                transform: 'scale(2)',
                transformOrigin: 'top left',
                border: '1px solid #333',
                borderRadius: '16px',
                fontFamily: 'sans-serif',
                position: 'relative',
                overflow: 'hidden',
                padding: '20px',
            }}
            >
            {/* Background FX */}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '300px', height: '300px', background: `radial-gradient(circle, ${rank.color}22 0%, transparent 70%)`, opacity: 0.5, display: 'flex' }} />
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '1px' }}>
                    {displayName.toUpperCase()}
                    </span>
                    <span style={{ color: '#8899a6', fontSize: 10, letterSpacing: '2px', fontWeight: 600 }}>
                    FULL STACK DEVELOPER
                    </span>
                </div>
                {/* Rank Badge */}
                <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                border: `2px solid ${rank.color}`,
                borderRadius: '8px',
                padding: '2px 12px',
                boxShadow: `0 0 15px ${rank.color}44`,
                backgroundColor: 'rgba(0,0,0,0.5)'
                }}>
                <span style={{ fontSize: 12, color: rank.color, marginRight: 5, fontWeight: 700 }}>RANK</span>
                <span style={{ fontSize: 24, color: rank.color, fontWeight: 900, textShadow: `0 0 10px ${rank.color}` }}>
                    {rank.label}
                </span>
                </div>
            </div>

            {/* Main Content Grid */}
            <div style={{ display: 'flex', gap: '20px', flex: 1 }}>
                
                {/* Left Column: Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
                <div style={statBoxStyle}>
                    <span style={labelStyle}>COMMITS (1 ANO)</span>
                    <span style={valueStyle}>{commits}</span>
                </div>
                <div style={statBoxStyle}>
                    <span style={labelStyle}>PULL REQUESTS</span>
                    <span style={valueStyle}>{prs}</span>
                </div>
                </div>

                {/* Right Column: Languages with Icons */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1.5, justifyContent: 'space-between' }}>
                <span style={{...labelStyle, marginBottom: 10}}>SYSTEM TECHNOLOGIES</span>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {topLangs.map((lang) => (
                    <div key={lang.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* Icon */}
                        <img 
                            src={lang.icon} 
                            width="20" 
                            height="20" 
                            style={{ opacity: 0.9 }}
                            alt={lang.name}
                        />
                        
                        {/* Bar Container */}
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                            <span style={{ fontSize: 10, color: '#e5e7eb', fontWeight: 600 }}>{lang.name}</span>
                            <span style={{ fontSize: 10, color: '#8899a6' }}>{lang.percent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '4px', background: '#1f2937', borderRadius: '2px', display: 'flex' }}>
                            <div style={{ 
                                width: `${lang.percent}%`, 
                                height: '100%', 
                                background: lang.color, 
                                borderRadius: '2px',
                                boxShadow: `0 0 8px ${lang.color}88`
                            }} />
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
                </div>

            </div>
            </div>
        </div>
      ),
      {
        width: 1100,
        height: 560,
        headers: { 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      },
    );

  } catch (error) {
    console.error(error);
    return new Response("System Failure", { status: 500 });
  }
}

// --- ESTILOS ---

const statBoxStyle: any = {
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '12px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '8px',
  flex: 1,
};

const labelStyle: any = {
  fontSize: '9px',
  color: '#8899a6',
  fontWeight: '700',
  letterSpacing: '1px',
};

const valueStyle: any = {
  fontSize: '24px',
  fontWeight: '800',
  color: '#fff',
  marginTop: '4px',
  letterSpacing: '-1px',
};