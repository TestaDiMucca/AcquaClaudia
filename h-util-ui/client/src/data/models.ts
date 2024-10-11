import { Aqueduct, Pipeline, PipelineStats, PipelineStatsPayload } from '@shared/common.types';
import { queryDatabase } from './sqlite';

export const pipeline = {
    upsert: (pipeline: Pipeline) => {
        const pipelineQuery = `--sql
          INSERT INTO Pipeline (uuid, name, color, manual_ranking)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(uuid) DO UPDATE SET
            name = excluded.name,
            color = excluded.color,
            manual_ranking = excluded.manual_ranking,
            modified = CURRENT_TIMESTAMP;
        `;
        queryDatabase.run(pipelineQuery, [pipeline.id, pipeline.name, pipeline.color, pipeline.manualRanking]);

        const pipelineIdQuery = `SELECT id FROM Pipeline WHERE uuid = ?`;
        const pipelineIdResult = queryDatabase.select<string>(pipelineIdQuery, [pipeline.id]);
        const pipelineId = pipelineIdResult[0];

        for (const module of pipeline.processingModules) {
            const moduleQuery = `--sql
              INSERT INTO Module (uuid, data)
              VALUES (?, ?)
              ON CONFLICT(uuid) DO UPDATE SET
                data = excluded.data;
            `;
            queryDatabase.run(moduleQuery, [module.id, JSON.stringify(module)]);

            const moduleIdQuery = `SELECT id FROM Module WHERE uuid = ?`;
            const moduleIdResult = queryDatabase.select<string>(moduleIdQuery, [module.id]);
            const moduleId = moduleIdResult[0];

            const pipelineModuleQuery = `--sql
              INSERT INTO PipelineModule (pipeline_id, module_id)
              VALUES (?, ?)
              ON CONFLICT(pipeline_id, module_id) DO NOTHING;
            `;

            queryDatabase.run(pipelineModuleQuery, [pipelineId, moduleId]);
        }
    },
    selectAll: (): Record<string, Pipeline> => {
        const pipelineFetchSql = `--sql
          SELECT
            p.uuid AS "pipelineId",
            p.name AS "pipelineName",
            p.created AS "pipelineCreated",
            p.modified AS "pipelineModified",
            p.color AS "pipelineColor",
            p.manual_ranking AS "pipelineManualRanking",
            m.uuid AS "moduleId",
            m.data AS "moduleData"
          FROM Module m
          JOIN PipelineModule pm ON m.id = pm.module_id
          JOIN Pipeline p ON p.id  = pm.pipeline_id;
        `;

        const rows = queryDatabase.selectObj<{
            pipelineId: string;
            pipelineName: string;
            pipelineCreated: string;
            pipelineModified: string;
            pipelineColor?: string;
            pipelineManualRanking?: number;
            moduleId: string;
            moduleData: string;
        }>(pipelineFetchSql);

        return rows.reduce<Record<string, Pipeline>>((a, row) => {
            if (!a[row.pipelineId])
                a[row.pipelineId] = {
                    name: row.pipelineName,
                    modified: row.pipelineModified,
                    created: row.pipelineCreated,
                    id: row.pipelineId,
                    processingModules: [],
                };

            a[row.pipelineId].processingModules.push(JSON.parse(row.moduleData));

            return a;
        }, {});
    },
    remove: (pipelineUuid: string, removeModules = true) => {
        if (removeModules) {
            const removeModulesForPipelineSql = `--sql
          DELETE FROM Module
          WHERE id IN (
              SELECT r.id FROM Module m
              JOIN PipelineModule pm ON pm.module_id = m.id
              JOIN Pipeline p ON p.id = pm.pipeline_id
              WHERE p.uuid = ?
          );
        `;
            queryDatabase.run(removeModulesForPipelineSql, [pipelineUuid]);
        }

        const removePipelineSql = `--sql
          DELETE FROM Pipeline WHERE uuid = ?;
        `;

        queryDatabase.run(removePipelineSql, [pipelineUuid]);
    },
};

const stats = {
    create: (pipelineId: number) => {
        const createPipelineStatsQuery = `--sql
          INSERT INTO PipelineStats (pipeline_id)
          VALUES (?)
          ON CONFLICT(pipeline_id) DO NOTHING;
        `;

        queryDatabase.run(createPipelineStatsQuery, [pipelineId]);
    },
    selectAll: (): PipelineStatsPayload[] => {
        const pipelineStatsQuery = `--sql
        SELECT
          p.uuid AS "pipelineId",
          p.name AS "pipelineName",
          ps.*
        FROM PipelineStats ps
        JOIN Pipeline p ON ps.pipeline_id = p.id;
      `;

        const rows = queryDatabase.selectObj<
            {
                pipelineId: string;
                pipelineName: string;
            } & PipelineStats
        >(pipelineStatsQuery);

        return rows.map<PipelineStatsPayload>((r) => ({
            pipelineId: r.pipelineId,
            pipelineName: r.pipelineName,
            timesRan: r.times_ran,
            wordsParsed: r.words_parsed,
            timeTaken: r.time_taken,
            bytesCompressed: r.bytes_compressed,
            filesProcessed: r.files_processed,
        }));
    },
    addRunStat: (pipelineUuid: string, stat: keyof PipelineStats, amount = 1) => {
        const pipelineStatSql = `--sql
          SELECT
            p.uuid AS "pipelineId",
            p.id AS "pipelineDbId",
            ps.*
          FROM Pipeline p
          LEFT JOIN PipelineStats ps ON ps.pipeline_id = p.id
          WHERE p.uuid = ?
          LIMIT 1;
        `;

        const rows = queryDatabase.selectObj<PipelineStats & { pipelineId: string; pipelineDbId: number }>(
            pipelineStatSql,
            [pipelineUuid],
        );

        /* No valid pipeline */
        if (!rows.length) return;

        if (!rows[0].id) stats.create(rows[0].pipelineDbId);

        const updateStatsSql = `--sql
          UPDATE PipelineStats
          SET ${stat} = ${stat} + ?
          WHERE id = ?;
          `;

        queryDatabase.run(updateStatsSql, [amount, rows[0].id]);
    },
};

const aqueducts = {
    selectAll: (): Aqueduct[] => {
        const aqueductsSql = `--sql
          SELECT
            p.uuid AS "pipelineId",
            a.uuid AS "id",
            a.name,
            a.description,
            a.directories
          FROM Aqueduct a
          JOIN Pipeline p ON a.pipeline_id = p.id;
        `;

        const rows = queryDatabase.selectObj<{ directories: string } & Omit<Aqueduct, 'directories'>>(aqueductsSql);

        return rows.map<Aqueduct>((r) => ({
            ...r,
            directories: JSON.parse(r.directories),
        }));
    },
    remove: (aqueductUuid: string) => {
        const removePipelineSql = `--sql
          DELETE FROM Aqueduct WHERE uuid = ?;
        `;

        queryDatabase.run(removePipelineSql, [aqueductUuid]);
    },
    upsert: (aqueduct: Aqueduct) => {
        const aqueductQuery = `--sql
          INSERT INTO Aqueduct (uuid, pipeline_id, name, description, directories)
          VALUES (?, (
            SELECT id FROM Pipeline WHERE uuid = ?
          ), ?, ?, ?)
          ON CONFLICT(uuid) DO UPDATE SET
            name = excluded.name,
            description = excluded.description,
            directories = excluded.directories,
            pipeline_id = excluded.pipeline_id;
        `;

        queryDatabase.run(aqueductQuery, [
            aqueduct.id,
            aqueduct.pipelineId,
            aqueduct.name,
            aqueduct.description,
            JSON.stringify(aqueduct.directories),
        ]);
    },
};

export const models = {
    aqueducts,
    pipeline,
    stats,
};
