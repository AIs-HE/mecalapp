// scripts/smoke-test.js
// Simple smoke test: create project, add two memories, fetch them and verify counts.
// Usage: node scripts/smoke-test.js

const fetch = global.fetch || require('node-fetch')

const BASE = 'http://localhost:3000'
const CLIENT_ID = '10000000-0000-0000-0000-000000000001' // dev seed client (from fixtures)

async function waitForServer(timeoutMs = 30000) {
    const start = Date.now()
    while (Date.now() - start < timeoutMs) {
        try {
            const res = await fetch(`${BASE}/api/projects`)
            if (res.ok) return true
        } catch (e) {
            // ignore
        }
        await new Promise(r => setTimeout(r, 1000))
    }
    return false
}

async function run() {
    console.log('Smoke test: waiting for server...')
    const up = await waitForServer(30000)
    if (!up) {
        console.error('Server did not start within timeout')
        process.exit(2)
    }
    console.log('Server is up. Creating project...')

    // Create project
    const createRes = await fetch(`${BASE}/api/projects`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Smoke Test Project', client_id: CLIENT_ID, cost_center: 'HE-SMOKE' })
    })
    const createJson = await createRes.json()
    if (!createRes.ok) {
        console.error('Failed to create project', createJson)
        process.exit(3)
    }
    const project = createJson.project
    console.log('Created project:', project.id)

    // Create memories
    const types = ['circuit', 'protection']
    for (const t of types) {
        const res = await fetch(`${BASE}/api/project_memories`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: project.id, memory_type: t, version: '1.0', status: 'draft' })
        })
        const j = await res.json()
        if (!res.ok) {
            console.error('Failed to create memory', t, j)
            process.exit(4)
        }
        console.log('Created memory', t, '->', j.memory?.id || '(no id)')
    }

    // Fetch memories
    const memRes = await fetch(`${BASE}/api/project_memories?project_id=${project.id}`)
    const memJson = await memRes.json()
    if (!memRes.ok) {
        console.error('Failed to fetch project_memories', memJson)
        process.exit(5)
    }
    console.log('Fetched memories count:', (memJson.memories || []).length)

    // Fetch projects and find the created project
    const projRes = await fetch(`${BASE}/api/projects`)
    const projJson = await projRes.json()
    if (!projRes.ok) {
        console.error('Failed to fetch projects', projJson)
        process.exit(6)
    }
    const found = (projJson.projects || []).find(p => p.id === project.id)
    if (!found) {
        console.error('Created project not found in projects list')
        process.exit(7)
    }
    console.log('Project as reported by API, memories_count:', found.memories_count)

    // Verify counts
    const memCount = (memJson.memories || []).length
    if (Number(found.memories_count) !== memCount) {
        console.error('Mismatch: project.memories_count', found.memories_count, 'vs fetched memories', memCount)
        process.exit(8)
    }

    console.log('SMOKE TEST PASSED')
    process.exit(0)
}

run().catch(e => { console.error(e); process.exit(10) })
