import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

type TableProps = {
    caption: string,
    columns: {
        id: string,
        title: string,
        render?: (value: any, rows: any) => React.ReactNode
    }[],
    rows: any[]
}

export function TableBase(props: TableProps) {
    return (
        <>
            <Table>
                <TableCaption>{props.caption}</TableCaption>
                <TableHeader>
                    <TableRow>
                        {props.columns.map((column, index) => (
                            <TableHead key={column.id || index}>{column.title}</TableHead>
                        ))}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {props.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                            {props.columns.map((column, colIndex) => {
                                const value = row[column.id];
                                return (
                                    <TableCell key={colIndex}>
                                        {column.render ? column.render(value, row) : value}
                                    </TableCell>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </>
    )
}